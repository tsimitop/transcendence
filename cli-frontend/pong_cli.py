#!/usr/bin/env python3

import curses
import time
import sys
import os
import json
import asyncio
import ssl 
from pprint import pprint
from typing import Any, Dict, List, Optional, Tuple, Union, cast, Literal
from dataclasses import dataclass, field
from datetime import datetime

import aiohttp
from aiohttp import ClientTimeout, TCPConnector, ClientSession


PING_MSG = json.dumps({"target_endpoint": "ping", "payload": ""})


@dataclass
class Point:
    x: float
    y: float

    @classmethod
    def from_str_or_float(cls, x, y):
        """Create a Point from string or float values"""
        return cls(
            x=float(x) if isinstance(x, str) else x,
            y=float(y) if isinstance(y, str) else y
        )

@dataclass
class Paddle:
    topPoint: Point
    height: float
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create a Paddle from a dictionary"""
        return cls(
            topPoint=Point.from_str_or_float(
                data["topPoint"]["x"],
                data["topPoint"]["y"]
            ),
            height=float(data["height"])
        )

@dataclass
class Ball:
    x: float
    y: float
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create a Ball from a dictionary"""
        return cls(
            x=float(data["x"]) if isinstance(data["x"], str) else data["x"],
            y=float(data["y"]) if isinstance(data["y"], str) else data["y"]
        )

@dataclass
class PongGame:
    id: str
    status: Literal["waiting", "countdown", "playing", "finished"]
    ball: Ball
    leftPaddle: Paddle
    rightPaddle: Paddle
    lastUpdateTime: int
    gameMode: Literal["classic"]
    maxScore: int
    scores: Dict[str, int] = field(default_factory=dict)
    countdown: Optional[int] = None
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create a PongGame from a dictionary"""
        return cls(
            id=data["id"],
            status=data["status"],
            ball=Ball.from_dict(data["ball"]),
            leftPaddle=Paddle.from_dict(data["leftPaddle"]),
            rightPaddle=Paddle.from_dict(data["rightPaddle"]),
            lastUpdateTime=data["lastUpdateTime"],
            gameMode=data["gameMode"],
            maxScore=data["maxScore"],
            scores=data.get("scores", {}),
            countdown=data.get("countdown")
        )

    @property
    def is_playing(self) -> bool:
        """Check if the game is in playing state"""
        return self.status == "playing"

    @property
    def is_finished(self) -> bool:
        """Check if the game is finished"""
        return self.status == "finished"
    
    @property
    def is_waiting(self) -> bool:
        """Check if the game is waiting for players"""
        return self.status == "waiting"
    
    @property
    def last_update_datetime(self) -> datetime:
        """Convert lastUpdateTime to datetime"""
        return datetime.fromtimestamp(self.lastUpdateTime / 1000)


class BackendClient:
    def __init__(self, username: str, password: str, url: str) -> None:
        self.username: str = username
        self.password: str = password
        self.url: str = url
        self.session: Optional[aiohttp.ClientSession] = None
        self.access_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        self.websocket_client = None
        self.is_connected: asyncio.Event = asyncio.Event()
        self.requires_2fa_input = asyncio.Event()
        self.got_2fa_input = asyncio.Future()
        self.ws = None
        self.incoming_messages = asyncio.Queue()
        self.outgoing_messages = asyncio.Queue()

    async def __aenter__(self) -> "BackendClient":
        """Enter the context manager"""
        try:
            await self.start()
        except Exception as e:
            await self.close()
            raise e
        pprint(f"Connected to backend at {self.url}")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit the context manager"""
        await self.close()

    async def start(self):
        """Start the backend client and authenticate"""
        # Initialize the aiohttp session
        await self.connect()
        # Authenticate with the backend server
        await self.authenticate()
        assert self.is_connected, "Failed to authenticate with the backend server"
        async def keep_token_updated():
            while True:
                # Check if the access token is still valid
                if not await self.validate_auth_status():
                    raise ConnectionError("We're not authenticated anymore")
                await asyncio.sleep(20)

        async def send_messages_from_queue():
            while not self.ws:
                await asyncio.sleep(0.1)
            while True:
                message = await self.outgoing_messages.get()
                if message is None:
                    break
                await self.send_to_server(message)
        
        async with asyncio.TaskGroup() as tg:
            _update_token_task = tg.create_task(keep_token_updated())
            # Connect to the websocket server
            _websocket_handler = tg.create_task(self.handle_websocket())
            _outbox = tg.create_task(send_messages_from_queue())
        raise GracefulExit("network ended")
        
    async def handle_websocket(self):
        """Receive messages from the websocket server"""
        while not self.access_token:
            await asyncio.sleep(1)
        if not self.access_token:
            raise ConnectionError("Access token is required for WebSocket connection")

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connector = TCPConnector(ssl=ssl_context)
        
        websocket_url = f'{self.url}/ws?token={self.access_token}'
        
        async with ClientSession(connector=connector) as session:
            async with session.ws_connect(websocket_url) as ws:
                self.ws = ws
                self.incoming_messages.put_nowait("init")
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        if msg.data == 'close':
                            await ws.close()
                            break
                        else:
                            await self.incoming_messages.put(msg.data)
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        break
        self.ws = None
        raise Exception("websocket closed")
    
    async def send_to_server(self, data: str):
        if not self.ws:
            raise ConnectionError("ws not connected")
        await self.ws.send_str(data)

    async def connect(self) -> aiohttp.ClientSession:
        """Initialize aiohttp client session with cookie support"""
        if self.session is None or self.session.closed:
            # Create a client session that preserves cookies
            cookie_jar = aiohttp.CookieJar(unsafe=False)
            
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connector = TCPConnector(ssl=ssl_context)
                
            self.session = aiohttp.ClientSession(
                cookie_jar=cookie_jar,
                connector=connector
            )
        
        return self.session

    async def authenticate(self) -> None:
        """Authenticate with the backend server using provided credentials"""
        
        # Prepare the sign-in request payload
        payload: Dict[str, str] = {
            "usernameOrEmail": self.username,
            "password": self.password
        }

        # Make the authentication request
        assert self.session is not None
        async with self.session.post(
            f"{self.url}/api/sign-in",
            json=payload,
            timeout=ClientTimeout(5)
        ) as response:
            # Process the response
            data: Dict[str, Any] = await response.json()
            
            if not data.get("user"):
                error_msg: str = data.get("errorMessage", "Authentication failed")
                raise ConnectionError(f"{error_msg=}")
            
            # Check if 2FA is required
            if data.get("errorMessage") and "2FA" in data.get("errorMessage", ""):
                self.requires_2fa_input.set()
                code_2fa: str = await self.got_2fa_input
                assert code_2fa, f"Invalid 2fa code: {code_2fa}"
                return await self.validate_2fa(data["user"], code_2fa)
                
            # Store user data and token for future requests
            self.user_data = data["user"]
            self.access_token = data["jwtAccessToken"]
            if self.user_data["isSignedIn"]:
                self.is_connected.set()
            
            if self.is_connected.is_set():
                pprint(f"Successfully logged in as {self.user_data['username']}")
    
    async def validate_2fa(self, user_data: Dict[str, Any], code_2fa: str):
        """Validate a 2FA code when required"""
        # Prepare the 2FA validation request payload
        payload: Dict[str, Any] = {
            "user": user_data,
            "code2Fa": code_2fa
        }
        
        # Send the 2FA validation request
        assert self.session is not None
        async with self.session.post(
            f"{self.url}/api/validate-2fa",
            json=payload,
            timeout=ClientTimeout(5)
        ) as response:
            data: Dict[str, Any] = await response.json()
            
            if data.get("errorMessage"):
                raise ConnectionError(f"2FA validation failed: {data['errorMessage']}")

            # Store the authentication info
            self.user_data = user_data
            self.access_token = data["jwtAccessToken"]
            self.is_connected.set()
            
            pprint(f"Successfully authenticated with 2FA as {user_data.get('username')}")
                    
    async def validate_auth_status(self) -> bool:
        """Check if the current authentication is valid"""
        if not self.session or not self.access_token:
            raise ConnectionError("Session or access token is not set")
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}"
        }
        
        async with self.session.post(
            f"{self.url}/api/validate-access-token",
            headers=headers,
            json={"user": self.user_data},
            timeout=ClientTimeout(5)
        ) as response:
            data = await response.json()
            
            # If the token is valid, return True
            if data.get("isAccessTokenValid", False):
                return True
                
            # If we need a new access token, try to get one
            if data.get("isNewAccessTokenNeeded", False) and data.get("isRefreshTokenValid", False):
                return await self.refresh_access_token()
                
            return False

    async def refresh_access_token(self) -> bool:
        """Request a new access token using the refresh token (in cookies)"""
        assert self.session is not None
        async with self.session.post(
            f"{self.url}/api/generate-new-access-token",
            timeout=ClientTimeout(5),
        ) as response:
            data = await response.json()
            
            if not data.get("newJwtAccessToken"):
                raise ConnectionError("Failed to refresh access token")

            # Update the access token
            self.access_token = data["newJwtAccessToken"]
            
            # Update user data if available
            if all(k in data for k in ["userId", "email", "username"]):
                if not self.user_data:
                    self.user_data = {}
                self.user_data.update({
                    "id": data["userId"],
                    "email": data["email"],
                    "username": data["username"],
                    "isSignedIn": data.get("isSignedIn", False)
                })
        
            if data.get("isSignedIn", False):
                self.is_connected.set()
            else:
                self.is_connected.clear() 
            assert self.is_connected.is_set(), "Failed to refresh access token"
            return self.is_connected.is_set()

    async def close(self) -> None:
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()
        self.is_connected.clear()
        self.session = None
        pprint("Closed backend client session")


class GameClient(BackendClient):
    """Wrapper around the backend client to handle game-specific requests"""
    def __init__(self, username: str, password: str, url: str) -> None:
        super().__init__(username, password, url)
        self.game_id: Optional[str] = None
        self.game_data: Optional[Dict[str, Any]] = None
        self.last_pong = time.time()
        self._error = None
        self._available_games = []

    @property
    def user_id(self) -> str:
        """Get the user ID from the user data"""
        if self.user_data:
            return self.user_data.get("username", "")
        return ""

    @classmethod
    def from_login(cls, url: Optional[str] = None) -> "GameClient":
        # show login screen to enter username and password
        username = input("Enter email/username: ")
        password = input("Enter password: ")
        if not password or not username:
            # dummy login for development
            username, password = "anonym", "Anonym99!"
        if url is None:
            url = input("Enter backend URL: ")
        assert url, "Backend URL cannot be empty"
        assert username and password, "Username and password cannot be empty"
        return cls(username=username, password=password, url=url)
    
    async def __aenter__(self) -> 'GameClient':
        await super().__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await super().__aexit__(exc_type, exc_val, exc_tb)

    def get_error(self) -> Optional[Tuple[str, int]]:
        if self._error:
            error_msg, error_code = self._error
            self._error = None
            return error_msg, error_code
        return None

    async def ping_server(self):
        await self.is_connected.wait()
        while True:
            await asyncio.sleep(30)
            await self.send_to_server(PING_MSG)
            await asyncio.sleep(5)
            if not self.last_pong > time.time() - 15:
                raise ConnectionError("Server doesn't answer, pong timeout")

    async def consume_backend_messages(self):
        await self.is_connected.wait()
        while True:
            message = await self.incoming_messages.get()
            try:
                message = json.loads(message)
            except Exception as e:
                continue
            if message.get('target-endpoint') == "pong":
                self.last_pong = time.time()
                continue
            if not message.get('target-endpoint') == "pong-api":
                continue
            message = message.get('payload')
            if not message:
                continue
            # pong payload
            type, pong_data = message['type'], message['pong_data']
            if type == "error":
                self._error = (pong_data['message'], pong_data['code'])
            elif type == "game_states":
                self._available_games: List[dict] = pong_data  # list of game_state in waiting state
            elif type == "game_state":
                self.update_game_state(pong_data)

    def update_game_state(self, pong_data_payload: dict):
        game = pong_data_payload['game']
        if not game:
            return

    @staticmethod
    def to_pong_api_request(payload: dict) -> str:
        return json.dumps({
            "target_endpoint": "pong-api",
            "payload": payload
        })

    async def get_joinable_games(self):
        get_games_request = self.to_pong_api_request(
            {
                "type": "getGames",
                "pong_data": {}
            }
        )
        await self.send_to_server(get_games_request)
        while not self._available_games:
            await asyncio.sleep(0.05)
        games = [PongGame.from_dict(game) for game in self._available_games]
        self._available_games = []
        # filter out ongoing games (even though we shouldn't get them here)
        games = [game for game in games if game.is_waiting]
        # sort by creation date (newest first)
        return sorted(games, key=lambda x: x.lastUpdateTime, reverse=True)
    
    def send_key_input(self, *, up: bool):
        msg = self.to_pong_api_request(
            {
                "type": input,
                "pong_data": {
                    "userId": self.user_id,
                    "up": up
                }
            }
        )
        # this is supposed to be fast as lag would be annoying in gameplay
        self.outgoing_messages.put_nowait(msg)


# curses refresh decorator, pretty useless
def refresh(func):
    def wrapper(self, *args, **kwargs):
        try:
            result = func(self, *args, **kwargs)
            self.stdscr.refresh()
            return result
        except Exception as e:
            self.cleanup()
            raise e
    return wrapper


class PongCli:
    def __init__(self, game_client: GameClient):
        assert game_client.is_connected, "Backend client is not authenticated"
        self.client: GameClient = game_client
        self.stdscr = curses.initscr()
        curses.noecho()
        curses.cbreak()
        curses.curs_set(False)  # Hide the cursor
        curses.start_color()
        curses.init_pair(1, curses.COLOR_GREEN, curses.COLOR_BLACK)
        self.stdscr.keypad(True)
        self.stdscr.nodelay(True)  # Non-blocking input
        self.stdscr.clear()
        self.stdscr.refresh()

    async def run(self):
        async def wait_for_connection():
            while True:
                await asyncio.sleep(0.1)
                if self.client.requires_2fa_input.is_set():
                    self.client.got_2fa_input.set_result(
                        await self.text_input(msg="Enter two-factor authentication code:")
                    )
                    self.client.requires_2fa_input.clear()
                elif self.client.is_connected.is_set():
                    break
        await asyncio.wait_for(wait_for_connection(), timeout=60)
        while True:
            # main menu
            game_id = await self.main_menu()
            if not game_id:
                break
            # run game
            game_result = self.game_screen(game_id)
            # show game result
            self.show_game_result(game_result)
        raise GracefulExit(f"gui cancelled")

    def print_at(self, y: int, x: int, text: str) -> None:
        """
        Print text at the given coordinates (y, x).
        """
        max_y, max_x = self.screen_size
        if y < 0 or y >= max_y or x < 0 or x >= max_x:
            raise ValueError(f"Coordinates out of bounds: ({y}, {x})")
        self.stdscr.clear()
        self.stdscr.addstr(y, x, text)
        self.stdscr.refresh()

    async def text_input(self, y = 0, x = 0, msg = "Enter text:") -> str:
        self.print_at(y, x, msg)
        result = ""
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.1)
                continue
            elif key == ord('\n'):
                return result
            elif key in (curses.KEY_BACKSPACE, ord('\b'), ord('\x7f')):
                result = result[:-1]
            else:
                result += chr(key)
            self.print_at(y, x, f"{msg} {result}")
    
    async def show_error(self, error_msg: str):
        self.stdscr.clear()
        self.stdscr.addstr(0, 0, "An error occured:")
        self.stdscr.addstr(3, 0, error_msg)
        self.stdscr.addstr(6, 0, "Press q to return")
        self.stdscr.refresh()
        await self.wait_until_input("q")

    async def wait_until_input(self, input_key: Optional[str] = None) -> str:
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.25)
            elif input_key and key == ord(input_key):
                return chr(key)
            elif not input_key:
                return chr(key)
  
    @property
    def screen_size(self) -> Tuple[int, int]:
        """Get max values for (y, x)"""
        y, x = self.stdscr.getmaxyx()
        return y - 1, x - 1

    async def main_menu(self) -> Optional[PongGame]:
        max_y, max_x = self.screen_size
        menu = [
            ("Create a new game", self.create_game_screen),
            ("Join an existing game", self.join_existing_game_screen),
            ("Debug mode", self.debug_screen),
            ("Quit", None),
        ]
        selected_item = 0
        def draw_menu():
            self.stdscr.clear()
            self.stdscr.addstr(0, 0, f"Welcome to Pong CLI {self.client.user_id}!")
            for index, menu_item in enumerate(menu):
                y, x = int((max_y // 2) - ((len(menu)//2) - index)), int((max_x//2) - (len(menu_item[0]) // 2))
                if index == selected_item:
                    self.stdscr.attron(curses.color_pair(1))
                    self.stdscr.addstr(y, x, menu_item[0])
                    self.stdscr.attroff(curses.color_pair(1))
                else:
                    self.stdscr.addstr(y, x, menu_item[0])
            self.stdscr.refresh()
        draw_menu()
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.05)
            elif key == curses.KEY_UP:
                selected_item = (selected_item - 1) % len(menu)
                draw_menu()
            elif key == curses.KEY_DOWN:
                selected_item = (selected_item + 1) % len(menu)
                draw_menu()
            elif key == curses.KEY_ENTER or key == ord('\n'):
                if menu[selected_item][1]:
                    if ret_val := await menu[selected_item][1]():
                        return ret_val
                else:
                    return None
                draw_menu()

            if self.client._error:
                await self.show_error(error_msg=str(self.client._error))
                self.client._error = None


    async def create_game_screen(self):
        pass

    async def join_existing_game_screen(self) -> Optional[PongGame]:
        max_y, max_x = self.screen_size
        available_games = await self.client.get_joinable_games()
        menu = []
        for game in available_games:
            menu.append((f"ID: {game.id} | MAX SCORE: {game.maxScore}", game))

        selected_item = 0
        def draw_menu():
            self.stdscr.clear()
            self.stdscr.addstr(0, 0, f"Select one of the available games to join:")
            self.stdscr.addstr(max_y, 0, f"Press q to go back")
            for index, menu_item in enumerate(menu):
                y, x = int((max_y // 2) - ((len(menu)//2) - index)), int((max_x//2) - (len(menu_item[0]) // 2))
                if index == selected_item:
                    self.stdscr.attron(curses.color_pair(1))
                    self.stdscr.addstr(y, x, menu_item[0])
                    self.stdscr.attroff(curses.color_pair(1))
                else:
                    self.stdscr.addstr(y, x, menu_item[0])
            self.stdscr.refresh()
        draw_menu()
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.05)
            elif key == curses.KEY_UP:
                selected_item = (selected_item - 1) % len(menu)
                draw_menu()
            elif key == curses.KEY_DOWN:
                selected_item = (selected_item + 1) % len(menu)
                draw_menu()
            elif key == ord('q'):
                return None
            elif key == curses.KEY_ENTER or key == ord('\n'):
                if menu[selected_item]:
                    return menu[selected_item][1]  # game
                draw_menu()

    async def debug_screen(self) -> None:
        """print websocket messages"""
        await self.client.outgoing_messages.put(PING_MSG)
        await asyncio.sleep(0.3)
        messages = []
        self.print_at(0, 0, "Debug mode: Press 'q' to quit, 'i' to dump a msg on the ws")
        while True:
            # get messages from the queue
            while not self.client.incoming_messages.empty():
                message = await self.client.incoming_messages.get()
                messages.append(message)
                if len(messages) > curses.LINES - 1:
                    messages.pop(0)
            if messages:
                self.stdscr.clear()
                self.stdscr.addstr(0, 0, "Debug mode: Press 'q' to quit, 'i' to dump a msg on the ws")
                self.stdscr.addstr(1, 0, "WebSocket messages:")
                self.stdscr.addstr(2, 0, "---------------------")
                for index, message in enumerate(messages):
                    index += 3
                    if index >= curses.LINES - 1:
                        break
                    self.stdscr.addstr(index, 0, f"Message {message}")
                self.stdscr.refresh()
            
            key = await self.wait_until_input()
            if key == 'q':
                break
            elif key == 'i':
                input_str = await self.text_input()
                try:
                    await self.client.outgoing_messages.put(input_str)
                except Exception as error:
                    await self.show_error(str(error))
                self.print_at(0, 0, "Debug mode: Press 'q' to quit, 'i' to dump a msg on the ws")

    async def game_screen(self, game: PongGame) -> dict[str, Any]:
        """
        Screen which shows the game. Returns the game result.
        """
        await self.show_error(error_msg=f"Successfully selected a game:\n{str(game)}")
        return {}

    def show_game_result(self, game_result: dict[str, Any]) -> None:
        """
        Show the game result.
        """
        pprint(f"Game result:\n{game_result}")
        input("Press enter to continue with new game...")

    def cleanup(self) -> None:
        try:
            self.stdscr.clear()
            self.stdscr.refresh()
            curses.nocbreak()
            self.stdscr.keypad(False)
            curses.echo()
            curses.endwin()
        except Exception as e:
            print(f"Error during cleanup: {e}", file=sys.stderr)

class GracefulExit(Exception): pass

async def main():
    # TODO: move network on separate thread
    cli_args = sys.argv[1:]
    if len(cli_args) != 1:
        print("Usage: ./pong_cli.py <backend_url>", file=sys.stderr)
        sys.exit(1)
    
    backend_url = cli_args[0]
    game_client = GameClient.from_login(backend_url)
    terminal_ui = PongCli(game_client)
    try:
        async with asyncio.TaskGroup() as tg:
            # run the game client
            _client_task = tg.create_task(game_client.start())
            _ping_server = tg.create_task(game_client.ping_server())
            _handle_messages = tg.create_task(game_client.consume_backend_messages())
            # run the terminal UI
            _ui_task = tg.create_task(terminal_ui.run())
    except* Exception as exc_group:
        for exc in exc_group.exceptions:
            if not isinstance(exc, GracefulExit):
                raise
    finally:
        terminal_ui.cleanup()
        await game_client.close()
        print("Exiting Pong CLI...")

if __name__ == "__main__":
    asyncio.run(main())
