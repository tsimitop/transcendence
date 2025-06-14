#!/usr/bin/env python3

import curses
import time
import sys
import json
import asyncio
import traceback
import ssl
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Literal
from dataclasses import dataclass, field
from datetime import datetime

import aiohttp
from aiohttp import ClientTimeout, TCPConnector, ClientSession


def setup_logging() -> logging.Logger:
    log_file = Path(__file__).parent / "log_pong_cli.log"

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, mode='w'),
        ],
        force=True
    )

    logger = logging.getLogger('pong_cli')
    logger.info("=== Pong CLI Application Started ===")
    logger.info(f"Log file: {log_file}")
    return logger


logger = setup_logging()


@dataclass
class Point:
    x: float
    y: float

    @classmethod
    def from_str_or_float(cls, x: Any, y: Any) -> "Point":
        """Create a Point from string or float values"""
        return cls(x=float(x), y=float(y))

@dataclass
class Paddle:
    topPoint: Point
    height: float
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Paddle":
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
    def from_dict(cls, data: Dict[str, Any]) -> "Ball":
        """Create a Ball from a dictionary"""
        return cls(x=float(data["x"]), y=float(data["y"]))

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
    def from_dict(cls, data: Dict[str, Any]) -> "PongGame":
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
        self.requires_2fa_input: asyncio.Event = asyncio.Event()
        self.got_2fa_input: asyncio.Future[str] = asyncio.Future()
        self.ws: Optional[aiohttp.ClientWebSocketResponse] = None
        self.incoming_messages: asyncio.Queue[str] = asyncio.Queue()
        self.outgoing_messages: asyncio.Queue[str] = asyncio.Queue()
        logger.info(f"BackendClient initialized for user: {username}, URL: {url}")

    async def __aenter__(self) -> "BackendClient":
        """Enter the context manager"""
        logger.info("BackendClient entering context manager")
        try:
            await self.start()
        except Exception as e:
            logger.error(f"Failed to start BackendClient: {e}")
            await self.close()
            raise e
        print(f"Connected to backend at {self.url}")
        logger.info(f"Successfully connected to backend at {self.url}")
        return self

    async def __aexit__(self, exc_type: Optional[type], exc_val: Optional[Exception], _: Any) -> None:
        """Exit the context manager"""
        logger.info("BackendClient exiting context manager")
        if exc_type:
            logger.error(f"Context manager exiting with exception: {exc_type.__name__}: {exc_val}")
        await self.close()

    async def start(self) -> None:
        """Start the backend client and authenticate"""
        logger.info("Starting BackendClient")
        # Initialize the aiohttp session
        await self.connect()
        # Authenticate with the backend server
        await self.authenticate()
        assert self.is_connected, "Failed to authenticate with the backend server"
        logger.info("BackendClient authentication successful, starting background tasks")

        async def keep_token_updated() -> None:
            logger.info("Token validation task started")
            while True:
                # Check if the access token is still valid
                if not await self.validate_auth_status():
                    logger.error("Authentication lost, token validation failed")
                    raise ConnectionError("We're not authenticated anymore")
                logger.debug("Token validation successful")
                await asyncio.sleep(20)

        async def send_messages_from_queue() -> None:
            logger.info("Message sender task started")
            while not self.ws:
                await asyncio.sleep(0.1)
            while True:
                message = await self.outgoing_messages.get()
                if message is None:
                    logger.info("Message sender task stopping (None message received)")
                    break
                logger.debug(f"Sending message to server: {message[:100]}...")
                await self.send_to_server(message)

        async with asyncio.TaskGroup() as tg:
            tg.create_task(keep_token_updated())
            tg.create_task(self.handle_websocket())
            tg.create_task(send_messages_from_queue())
        raise GracefulExit("network ended")
        
    async def handle_websocket(self) -> None:
        """Receive messages from the websocket server"""
        logger.info("Starting WebSocket handler")
        while not self.access_token:
            await asyncio.sleep(1)

        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connector = TCPConnector(ssl=ssl_context)

        websocket_url = f'{self.url}/ws?token={self.access_token}&type=pong'
        logger.info(f"Connecting to WebSocket: {websocket_url}")

        async with ClientSession(connector=connector) as session:
            async with session.ws_connect(websocket_url) as ws:
                self.ws = ws
                logger.info("WebSocket connection established")
                self.incoming_messages.put_nowait("init")
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        if msg.data == 'close':
                            logger.info("Received close message from WebSocket")
                            await ws.close()
                            break
                        else:
                            logger.debug(f"Received WebSocket message: {msg.data[:100]}...")
                            await self.incoming_messages.put(msg.data)
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        logger.error(f"WebSocket error: {ws.exception()}")
                        break
        self.ws = None
        logger.warning("WebSocket connection closed")
        raise Exception("websocket closed")
    
    async def send_to_server(self, data: str) -> None:
        if not self.ws:
            logger.error("Attempted to send message but WebSocket not connected")
            raise ConnectionError("ws not connected")
        logger.debug(f"Sending to server: {data[:100]}...")
        await self.ws.send_str(data)

    async def connect(self) -> aiohttp.ClientSession:
        """Initialize aiohttp client session with cookie support"""
        logger.info("Initializing HTTP client session")
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
            logger.info("HTTP client session created")

        return self.session

    async def authenticate(self) -> None:
        """Authenticate with the backend server using provided credentials"""
        logger.info(f"Attempting authentication for user: {self.username}")

        # Prepare the sign-in request payload
        payload: Dict[str, str] = {
            "usernameOrEmail": self.username,
            "password": self.password
        }

        # Make the authentication request
        assert self.session is not None
        logger.info(f"Sending authentication request to {self.url}/api/sign-in")
        async with self.session.post(
            f"{self.url}/api/sign-in",
            json=payload,
            timeout=ClientTimeout(5)
        ) as response:
            # Process the response
            data: Dict[str, Any] = await response.json()
            logger.info(f"Authentication response status: {response.status}")

            if not data.get("user"):
                error_msg: str = data.get("errorMessage", "Authentication failed")
                logger.error(f"Authentication failed: {error_msg}")
                raise ConnectionError(f"{error_msg=}")

            # Check if 2FA is required
            if data.get("errorMessage") and "2FA" in data.get("errorMessage", ""):
                logger.info("2FA required, waiting for user input")
                self.requires_2fa_input.set()
                code_2fa: str = await self.got_2fa_input
                assert code_2fa, f"Invalid 2fa code: {code_2fa}"
                logger.info("2FA code received, validating")
                return await self.validate_2fa(data["user"], code_2fa)

            # Store user data
            self.user_data = data["user"]

            # Get the JWT access token from the dedicated endpoint
            await self.retrieve_access_token()

            if self.user_data["isSignedIn"] and self.access_token:
                self.is_connected.set()
                username = self.user_data['username']
                print(f"Successfully logged in as {username}")
                logger.info(f"Authentication successful for user: {username}")

    async def retrieve_access_token(self) -> None:
        """Retrieve the JWT access token from the dedicated endpoint"""
        logger.info("Retrieving access token from /api/ws-token")
        assert self.session is not None

        async with self.session.get(
            f"{self.url}/api/ws-token",
            timeout=ClientTimeout(5)
        ) as response:
            data: Dict[str, Any] = await response.json()

            if data.get("errorMessage") or not data.get("token"):
                error_msg = data.get("errorMessage", "Failed to retrieve access token")
                logger.error(f"Failed to get access token: {error_msg}")
                raise ConnectionError(f"Access token retrieval failed: {error_msg}")

            self.access_token = data["token"]
            logger.info("Successfully retrieved access token")

    async def validate_2fa(self, user_data: Dict[str, Any], code_2fa: str) -> None:
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

            # Get the JWT access token from the dedicated endpoint
            await self.retrieve_access_token()

            if self.access_token:
                self.is_connected.set()

            print(f"Successfully authenticated with 2FA as {user_data.get('username')}")
                    
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

            if data.get("errorMessage"):
                logger.error(f"Failed to refresh access token: {data['errorMessage']}")
                raise ConnectionError(f"Failed to refresh access token: {data['errorMessage']}")

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

            # Get the new access token from the dedicated endpoint
            await self.retrieve_access_token()

            if data.get("isSignedIn", False) and self.access_token:
                self.is_connected.set()
            else:
                self.is_connected.clear()
            assert self.is_connected.is_set(), "Failed to refresh access token"
            return True

    async def close(self) -> None:
        """Close the aiohttp session"""
        logger.info("Closing BackendClient")
        if self.session and not self.session.closed:
            await self.session.close()
            logger.info("HTTP session closed")
        self.is_connected.clear()
        self.session = None
        print("Closed backend client session")
        logger.info("BackendClient closed successfully")


class GameClient(BackendClient):
    """Wrapper around the backend client to handle game-specific requests"""
    def __init__(self, username: str, password: str, url: str) -> None:
        super().__init__(username, password, url)
        self.game_id: Optional[str] = None
        self.game_data: Optional[Dict[str, Any]] = None
        self.debug_mode: asyncio.Event = asyncio.Event()
        self.debug_queue: asyncio.Queue[str] = asyncio.Queue()
        self._error: Optional[Tuple[str, int]] = None
        self._available_games: asyncio.Queue[List[Dict[str, Any]]] = asyncio.Queue()
        self._game_over_data: Optional[Dict[str, Any]] = None
        logger.info("GameClient initialized")

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

    async def __aexit__(self, exc_type: Optional[type], exc_val: Optional[Exception], exc_tb: Any) -> None:
        await super().__aexit__(exc_type, exc_val, exc_tb)

    def get_error(self) -> Optional[Tuple[str, int]]:
        if self._error:
            error_msg, error_code = self._error
            self._error = None
            return error_msg, error_code
        return None



    async def consume_backend_messages(self) -> None:
        logger.info("Starting backend message consumer")
        await self.is_connected.wait()
        while True:
            message = await self.incoming_messages.get()
            if self.debug_mode.is_set():
                logger.debug(f"Debug mode: queuing message: {message[:100]}...")
                await self.debug_queue.put(message)
                continue
            try:
                message_data: Dict[str, Any] = json.loads(message)
            except Exception:
                logger.warning(f"Failed to parse message as JSON:, {message=}", exc_info=True)
                continue
            message = message_data
            if not message.get('target_endpoint') == "pong-api":
                logger.debug(f"Ignoring message with target_endpoint: {message.get('target_endpoint')}")
                continue

            # Handle the message based on type
            msg_type = message.get('type')
            logger.info(f"Processing pong-api message type: {msg_type}")
            if msg_type == "error":
                pong_data = message.get('pong_data', {})
                error_msg = pong_data.get('message', 'Unknown error')
                error_code = pong_data.get('code', 500)
                logger.error(f"Received error from server: {error_msg} (code: {error_code})")
                self._error = (error_msg, error_code)
            elif msg_type == "game_list":
                games_data = message.get('games', [])
                logger.info(f"Received game list: {len(games_data)} games")
                self._available_games.put_nowait(games_data)
            elif msg_type == "game_states":
                pong_data = message.get('pong_data', [])
                logger.info(f"Received game states: {len(pong_data)} games")
                self._available_games.put_nowait(pong_data)
            elif msg_type == "game_state":
                game_data = message.get('game', {})
                logger.debug(f"Received game state update for game: {game_data.get('id', 'unknown')}")
                self.update_game_state(game_data)
            elif msg_type == "game_created":
                game_id = message.get('gameId')
                logger.info(f"Game created with ID: {game_id}")
                self.game_id = game_id
            elif msg_type == "game_over":
                pong_data = message.get('pong_data', {})
                logger.info(f"Game over received: {pong_data}")
                self.handle_game_over(pong_data)

    def update_game_state(self, game_data: Dict[str, Any]) -> None:
        if not game_data:
            logger.warning("Received empty game data")
            return
        game_id = game_data.get('id', 'unknown')
        game_status = game_data.get('status', 'unknown')
        logger.debug(f"Updating game state for game {game_id}, status: {game_status}")

        if game_status == 'finished':
            logger.info(f"Ignoring finished game state update for game {game_id}")
            return

        if self.game_id and self.game_id != game_id:
            logger.debug(f"Ignoring game state update for different game {game_id}, current game: {self.game_id}")
            return

        self.game_data = game_data
        if not self.game_id:
            self.game_id = game_id

    def handle_game_over(self, pong_data: Dict[str, Any]) -> None:
        logger.info(f"Handling game over: {pong_data}")
        self.game_data = None
        self.game_id = None
        self._game_over_data = pong_data

    @staticmethod
    def to_pong_api_request(payload: Dict[str, Any]) -> str:
        return json.dumps({
            "target_endpoint": "pong-api",
            "payload": payload
        })

    async def get_joinable_games(self) -> List[PongGame]:
        logger.info("Requesting list of joinable games")
        get_games_request = self.to_pong_api_request(
            {
                "type": "game_list",
                "pong_data": {}
            }
        )
        await self.send_to_server(get_games_request)
        try:
            games_data = await asyncio.wait_for(self._available_games.get(), timeout=3)
            self._available_games = asyncio.Queue()
            games: List[PongGame] = []
            for game_data in games_data:
                if isinstance(game_data, dict) and game_data.get('state') == 'waiting':
                    # Convert backend game list format to PongGame format
                    pong_game_data = {
                        'id': game_data.get('id', ''),
                        'status': game_data.get('state', 'waiting'),
                        'ball': {'x': 0.5, 'y': 0.5},
                        'leftPaddle': {'topPoint': {'x': 0.0, 'y': 0.4}, 'height': 0.2},
                        'rightPaddle': {'topPoint': {'x': 0.99, 'y': 0.4}, 'height': 0.2},
                        'lastUpdateTime': int(time.time() * 1000),
                        'gameMode': 'classic',
                        'maxScore': 10,
                        'scores': {},
                        'countdown': None
                    }
                    games.append(PongGame.from_dict(pong_game_data))
            logger.info(f"Found {len(games)} joinable games")
            return sorted(games, key=lambda x: x.lastUpdateTime, reverse=True)
        except Exception as e:
            error_msg = traceback.format_exc()
            logger.error(f"Failed to get joinable games: {error_msg}")
            self._error = (error_msg, 420)
            return []

    def send_key_input(self, *, up: bool) -> None:
        direction = "up" if up else "down"
        logger.debug(f"Sending key input: {direction}")
        msg = self.to_pong_api_request(
            {
                "type": "input",
                "pong_data": {
                    "userId": self.user_id,
                    "up": up
                }
            }
        )
        self.outgoing_messages.put_nowait(msg)

    async def create_new_game(self, mode: str, max_score: int, player_alias: str) -> None:
        logger.info(f"Creating new game with mode: {mode}, max_score: {max_score}, alias: {player_alias}")
        create_game_request = self.to_pong_api_request(
            {
                "type": "create_game",
                "pong_data": {
                    "playerAlias": player_alias,
                    "gameMode": "remote",
                    "localOpponent": ""
                }
            }
        )
        await self.outgoing_messages.put(create_game_request)

    async def join_game(self, game_id: str, player_alias: str) -> None:
        logger.info(f"Joining game with ID: {game_id}, alias: {player_alias}")
        join_game_request = self.to_pong_api_request(
            {
                "type": "join_game",
                "pong_data": {
                    "OpponentName": self.user_id,
                    "OpponentAlias": player_alias,
                    "gameId": game_id
                }
            }
        )
        await self.outgoing_messages.put(join_game_request)

    def clear_game_state(self) -> None:
        logger.info("Clearing game state")
        self.game_data = None
        self.game_id = None
        self._game_over_data = None

    async def create_and_wait_for_game(self, mode: str, max_score: int, player_alias: str) -> Optional[PongGame]:
        logger.info(f"Creating and waiting for new game with mode: {mode}, max_score: {max_score}, alias: {player_alias}")

        old_game_id = self.game_id
        self.game_id = None

        await self.create_new_game(mode, max_score, player_alias)

        try:
            timeout = 5.0
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.game_id and self.game_id != old_game_id:
                    logger.info(f"New game created with ID: {self.game_id}")
                    pong_game_data = {
                        'id': self.game_id,
                        'status': 'waiting',
                        'ball': {'x': 0.5, 'y': 0.5},
                        'leftPaddle': {'topPoint': {'x': 0.0, 'y': 0.4}, 'height': 0.2},
                        'rightPaddle': {'topPoint': {'x': 0.99, 'y': 0.4}, 'height': 0.2},
                        'lastUpdateTime': int(time.time() * 1000),
                        'gameMode': 'classic',
                        'maxScore': max_score,
                        'scores': {},
                        'countdown': None
                    }
                    return PongGame.from_dict(pong_game_data)
                await asyncio.sleep(0.1)

            logger.error("Timeout waiting for game creation confirmation")
            return None

        except Exception as e:
            logger.error(f"Error creating game: {e}")
            return None


class PongCli:
    MAX_SCORE: int = 30
    GAME_MODES: List[str] = ["classic"]

    def __init__(self, game_client: GameClient) -> None:
        assert game_client.is_connected, "Backend client is not authenticated"
        logger.info("Initializing PongCli terminal interface")
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
        logger.info("PongCli terminal interface initialized successfully")

    async def run(self) -> None:
        logger.info("Starting PongCli main loop")
        async def wait_for_connection() -> None:
            while True:
                await asyncio.sleep(0.1)
                if self.client.requires_2fa_input.is_set():
                    logger.info("2FA input required, prompting user")
                    self.client.got_2fa_input.set_result(
                        await self.text_input(msg="Enter two-factor authentication code:")
                    )
                    self.client.requires_2fa_input.clear()
                elif self.client.is_connected.is_set():
                    break
        await asyncio.wait_for(wait_for_connection(), timeout=60)
        logger.info("Connection established, entering main menu loop")
        while True:
            # clear any previous game state before showing main menu
            self.client.clear_game_state()
            # main menu
            game = await self.main_menu()
            if not game:
                logger.info("User chose to quit from main menu")
                break
            # run game
            logger.info(f"Starting game: {game.id}")
            game_result = await self.game_screen(game)
            # show game result
            logger.info(f"Game finished, showing results: {game_result}")
            await self.show_game_result(game_result)
        raise GracefulExit(f"gui cancelled")

    def print_at(self, lines: List[Tuple[int, int, str]], refresh: bool = True) -> None:
        """
        Print text at the given coordinates (y, x).
        """
        max_y, max_x = self.screen_size
        if refresh:
            self.stdscr.clear()
        for y, x, msg in lines:
            if y < 0 or y >= max_y or x < 0 or x >= max_x:
                raise ValueError(f"Coordinates out of bounds: ({y}, {x})")
            self.stdscr.addstr(y, x, msg)
        if refresh:
            self.stdscr.refresh()

    async def text_input(self, y: int = 0, x: int = 0, msg: str = "Enter text:") -> str:
        self.print_at([(y, x, msg)])
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
            self.print_at([(y, x, f"{msg} {result}")])

    async def show_error(self, error_msg: str) -> None:
        max_y, _ = self.screen_size
        self.stdscr.clear()
        self.stdscr.addstr(0, 0, "An error occured:")
        self.stdscr.addstr(3, 0, error_msg)
        self.stdscr.addstr(max_y, 0, "Press q to return")
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

    def draw_centered_menu(self, title: str, menu_items: List[Tuple[str, Any]], selected_item: int, footer: str = "") -> None:
        """Helper method to draw a centered menu with consistent styling"""
        max_y, max_x = self.screen_size
        self.stdscr.clear()
        self.stdscr.addstr(0, 0, title)
        if footer:
            self.stdscr.addstr(max_y, 0, footer)

        if menu_items:
            for index, menu_item in enumerate(menu_items):
                y = int((max_y // 2) - ((len(menu_items)//2) - index))
                x = int((max_x//2) - (len(menu_item[0]) // 2))
                if index == selected_item:
                    self.stdscr.attron(curses.color_pair(1))
                    self.stdscr.addstr(y, x, menu_item[0])
                    self.stdscr.attroff(curses.color_pair(1))
                else:
                    self.stdscr.addstr(y, x, menu_item[0])
        else:
            msg = "No items available."
            self.stdscr.addstr(max_y//2, (max_x//2) - len(msg)//2, msg)

        self.stdscr.refresh()

    async def main_menu(self) -> Optional[PongGame]:
        logger.info("Displaying main menu")
        menu: List[Tuple[str, Optional[Any]]] = [
            ("Create a new game", self.create_game_screen),
            ("Join an existing game", self.join_existing_game_screen),
            ("Debug mode", self.debug_screen),
            ("Quit", None),
        ]
        selected_item = 0
        self.draw_centered_menu(f"Welcome to Pong CLI {self.client.user_id}!", menu, selected_item)
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.05)
            elif key == curses.KEY_UP:
                selected_item = (selected_item - 1) % len(menu)
                logger.debug(f"Menu navigation: UP, selected item: {selected_item}")
                self.draw_centered_menu(f"Welcome to Pong CLI {self.client.user_id}!", menu, selected_item)
            elif key == curses.KEY_DOWN:
                selected_item = (selected_item + 1) % len(menu)
                logger.debug(f"Menu navigation: DOWN, selected item: {selected_item}")
                self.draw_centered_menu(f"Welcome to Pong CLI {self.client.user_id}!", menu, selected_item)
            elif key == curses.KEY_ENTER or key == ord('\n'):
                menu_option = menu[selected_item][0]
                logger.info(f"User selected menu option: {menu_option}")
                if menu[selected_item][1]:
                    if ret_val := await menu[selected_item][1]():
                        return ret_val
                else:
                    return None
                self.draw_centered_menu(f"Welcome to Pong CLI {self.client.user_id}!", menu, selected_item)

            if self.client._error:
                error_msg = str(self.client._error)
                logger.error(f"Displaying error to user: {error_msg}")
                await self.show_error(error_msg=error_msg)
                self.client._error = None
                self.draw_centered_menu(f"Welcome to Pong CLI {self.client.user_id}!", menu, selected_item)

    async def create_game_screen(self) -> Optional[PongGame]:
        game_mode = self.GAME_MODES[0]
        max_score = 10
        player_alias = ""

        options: List[Tuple[str, str]] = [
            (f"Player Alias: {player_alias or '[Not Set]'}", "alias"),
            (f"Game Mode: {game_mode}", "mode"),
            (f"Max Score: {max_score}", "score"),
            ("Create Game", "create"),
            ("Cancel", "cancel")
        ]

        selected_item = 0
        self.draw_centered_menu("Create a new game:", options, selected_item)
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.01)
            elif key == curses.KEY_UP:
                selected_item = (selected_item - 1) % len(options)
                self.draw_centered_menu("Create a new game:", options, selected_item)
            elif key == curses.KEY_DOWN:
                selected_item = (selected_item + 1) % len(options)
                self.draw_centered_menu("Create a new game:", options, selected_item)
            elif key == ord('q'):
                return None
            elif key == curses.KEY_ENTER or key == ord('\n'):
                option = options[selected_item][1]
                if option == "alias":
                    max_y, _ = self.screen_size
                    alias_input = await self.text_input(max_y//2, 0, "Enter your alias:")
                    if alias_input.strip():
                        player_alias = alias_input.strip()
                        options[selected_item] = (f"Player Alias: {player_alias}", option)
                    self.draw_centered_menu("Create a new game:", options, selected_item)
                elif option == "score":
                    max_score = (max_score + 1) % self.MAX_SCORE
                    options[selected_item] = (f"Max Score: {max_score}", option)
                    self.draw_centered_menu("Create a new game:", options, selected_item)
                elif option == "mode":
                    current_index = self.GAME_MODES.index(game_mode)
                    next_index = (current_index + 1) % len(self.GAME_MODES)
                    game_mode = self.GAME_MODES[next_index]
                    options[selected_item] = (f"Game Mode: {game_mode}", option)
                    self.draw_centered_menu("Create a new game:", options, selected_item)
                elif option == "create":
                    if not player_alias.strip():
                        await self.show_error("Please enter your alias before creating a game")
                        self.draw_centered_menu("Create a new game:", options, selected_item)
                        continue
                    created_game = await self.client.create_and_wait_for_game(game_mode, max_score, player_alias)
                    if created_game:
                        return created_game
                    else:
                        await self.show_error("Failed to create game")
                        self.draw_centered_menu("Create a new game:", options, selected_item)
                elif option == "cancel":
                    return None

    async def join_existing_game_screen(self) -> Optional[PongGame]:
        # First, get the player alias
        max_y, _ = self.screen_size
        player_alias = await self.text_input(max_y//2, 0, "Enter your alias:")
        if not player_alias.strip():
            await self.show_error("Alias is required to join a game")
            return None

        player_alias = player_alias.strip()

        # Then show available games
        max_y, max_x = self.screen_size
        self.stdscr.clear()
        self.stdscr.addstr(0, 0, f"Select one of the available games to join (Alias: {player_alias}):")
        msg = "Loading games..."
        self.stdscr.addstr(max_y//2, (max_x//2) - len(msg)//2, msg)
        self.stdscr.refresh()

        available_games = await self.client.get_joinable_games()
        menu: List[Tuple[str, PongGame]] = [(f"ID: {game.id} | MAX SCORE: {game.maxScore}", game) for game in available_games]

        selected_item = 0
        self.draw_centered_menu(f"Select one of the available games to join (Alias: {player_alias}):", menu, selected_item, "Press q to go back")
        while True:
            key = self.stdscr.getch()
            if key == curses.ERR:
                await asyncio.sleep(0.05)
            elif key == curses.KEY_UP:
                selected_item = (selected_item - 1) % len(menu)
                self.draw_centered_menu(f"Select one of the available games to join (Alias: {player_alias}):", menu, selected_item, "Press q to go back")
            elif key == curses.KEY_DOWN:
                selected_item = (selected_item + 1) % len(menu)
                self.draw_centered_menu(f"Select one of the available games to join (Alias: {player_alias}):", menu, selected_item, "Press q to go back")
            elif key == ord('q'):
                return None
            elif key == curses.KEY_ENTER or key == ord('\n'):
                if menu and selected_item < len(menu) and menu[selected_item]:
                    selected_game = menu[selected_item][1]
                    await self.client.join_game(selected_game.id, player_alias)
                    await asyncio.sleep(0.5)
                    return selected_game

    async def debug_screen(self) -> None:
        """print websocket messages"""
        self.client.debug_mode.set()
        messages: List[str] = []
        self.print_at([(0, 0, "Debug mode: Press 'q' to quit, 'i' to dump a msg on the ws")])
        while True:
            # get messages from the queue
            while not self.client.debug_queue.empty():
                message = await self.client.debug_queue.get()
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
                    self.stdscr.addstr(index, 0, f"Message {index-3}: {message}")
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
                self.print_at([(0, 0, "Debug mode: Press 'q' to quit, 'i' to dump a msg on the ws")])

        self.client.debug_mode.clear()

    async def game_screen(self, game: PongGame) -> Dict[str, Any]:
        """Real remote gameplay implementation"""
        logger.info(f"Starting game screen for game: {game.id}")
        max_y, max_x = self.screen_size

        game_width: int = max_x - 10
        game_height: int = max_y - 6
        start_x: int = 5
        start_y: int = 3

        paddle_height: int = 5
        left_paddle_x: int = start_x + 1
        right_paddle_x: int = start_x + game_width - 2

        game_id: str = game.id
        max_score: int = game.maxScore

        running: bool = True
        last_time: float = time.time()
        fps: int = 30
        frame_duration: float = 1.0 / fps

        instructions: str = "Press 'q' to quit, ↑/↓ to move paddle"

        left_score: int = 0
        right_score: int = 0
        ball_x: int = start_x + game_width // 2
        ball_y: int = start_y + game_height // 2
        left_paddle_y: int = start_y + (game_height // 2) - (paddle_height // 2)
        right_paddle_y: int = start_y + (game_height // 2) - (paddle_height // 2)

        logger.info(f"Game screen initialized: {game_width}x{game_height}, FPS: {fps}")
        
        while running:
            current_time = time.time()
            if current_time - last_time < frame_duration:
                await asyncio.sleep(frame_duration - (current_time - last_time))
            last_time = time.time()

            # Update game state from server
            if self.client.game_data and self.client.game_data.get('id') == game_id:
                server_game: Dict[str, Any] = self.client.game_data

                # Update ball position
                ball_data: Dict[str, Any] = server_game.get('ball', {})
                new_ball_x: int = start_x + int(ball_data.get('x', 0.5) * game_width)
                new_ball_y: int = start_y + int(ball_data.get('y', 0.5) * game_height)

                # Log significant ball movement
                if abs(new_ball_x - ball_x) > 5 or abs(new_ball_y - ball_y) > 3:
                    logger.debug(f"Ball moved significantly: ({ball_x},{ball_y}) -> ({new_ball_x},{new_ball_y})")

                ball_x, ball_y = new_ball_x, new_ball_y

                # Update paddle positions
                left_paddle_data: Dict[str, Any] = server_game.get('leftPaddle', {}).get('topPoint', {})
                right_paddle_data: Dict[str, Any] = server_game.get('rightPaddle', {}).get('topPoint', {})

                left_paddle_y = start_y + int(left_paddle_data.get('y', 0.4) * game_height)
                right_paddle_y = start_y + int(right_paddle_data.get('y', 0.4) * game_height)

                # Update scores
                scores: List[Dict[str, Any]] = server_game.get('scores', [])
                if len(scores) >= 2:
                    new_left_score: int = scores[0].get('score', 0)
                    new_right_score: int = scores[1].get('score', 0)

                    # Log score changes
                    if new_left_score != left_score or new_right_score != right_score:
                        logger.info(f"Score update: {left_score}-{right_score} -> {new_left_score}-{new_right_score}")

                    left_score, right_score = new_left_score, new_right_score

                # Check game status
                game_status: str = server_game.get('status', 'waiting')
                if game_status == 'finished':
                    logger.info("Game finished, exiting game loop")
                    running = False

            # Check for game over from server
            if self.client._game_over_data:
                running = False

            self.stdscr.clear()

            # Display game info
            self.stdscr.addstr(0, 0, f"Game ID: {game_id} | Max Score: {max_score}")
            self.stdscr.addstr(1, 0, instructions)

            # Display game status
            if self.client.game_data:
                status = self.client.game_data.get('status', 'unknown')
                self.stdscr.addstr(2, 0, f"Status: {status}")
                if status == 'countdown':
                    countdown = self.client.game_data.get('countdown', 0)
                    if countdown > 0:
                        self.stdscr.addstr(2, 20, f"Starting in: {countdown}")

            # Display scores
            score_x = start_x + (game_width // 2) - 5
            self.stdscr.addstr(start_y - 2, score_x, f"{left_score}   -   {right_score}")

            # Draw game field borders
            for x in range(start_x, start_x + game_width + 1):
                self.stdscr.addch(start_y, x, curses.ACS_HLINE)
                self.stdscr.addch(start_y + game_height, x, curses.ACS_HLINE)

            for y in range(start_y, start_y + game_height + 1):
                self.stdscr.addch(y, start_x, curses.ACS_VLINE)
                self.stdscr.addch(y, start_x + game_width, curses.ACS_VLINE)

            # Draw corners
            self.stdscr.addch(start_y, start_x, curses.ACS_ULCORNER)
            self.stdscr.addch(start_y, start_x + game_width, curses.ACS_URCORNER)
            self.stdscr.addch(start_y + game_height, start_x, curses.ACS_LLCORNER)
            self.stdscr.addch(start_y + game_height, start_x + game_width, curses.ACS_LRCORNER)

            # Draw center line
            center_x = start_x + (game_width // 2)
            for y in range(start_y + 1, start_y + game_height):
                if y % 2 == 0:
                    self.stdscr.addch(y, center_x, '|')

            # Draw paddles
            for y in range(paddle_height):
                if left_paddle_y + y >= start_y + 1 and left_paddle_y + y < start_y + game_height:
                    self.stdscr.addch(left_paddle_y + y, left_paddle_x, '█')
                if right_paddle_y + y >= start_y + 1 and right_paddle_y + y < start_y + game_height:
                    self.stdscr.addch(right_paddle_y + y, right_paddle_x, '█')

            # Draw ball
            try:
                if (ball_x >= start_x + 1 and ball_x < start_x + game_width and
                    ball_y >= start_y + 1 and ball_y < start_y + game_height):
                    self.stdscr.addch(int(ball_y), int(ball_x), 'O')
            except curses.error:
                pass

            # Handle input
            key = self.stdscr.getch()
            if key == ord('q'):
                logger.info("User pressed 'q' to quit game")
                running = False
            elif key == curses.KEY_UP:
                logger.debug("User input: UP arrow (paddle up)")
                self.client.send_key_input(up=True)
            elif key == curses.KEY_DOWN:
                logger.debug("User input: DOWN arrow (paddle down)")
                self.client.send_key_input(up=False)

            self.stdscr.refresh()

            # Check for errors
            error = self.client.get_error()
            if error:
                logger.error(f"Game error occurred: {error[0]} (code: {error[1]})")
                await self.show_error(f"Game error: {error[0]}")
                running = False

        # Determine winner
        if left_score == right_score:
            winner = "tie"
        else:
            winner = "left" if left_score > right_score else "right"

        return {
            "left_score": left_score,
            "right_score": right_score,
            "winner": winner,
            "game_id": game_id,
            "game_over_data": self.client._game_over_data
        }

    async def show_game_result(self, game_result: Dict[str, Any]) -> None:
        """
        Show the game result.
        """
        if not game_result:
            return
        self.print_at([(5, 5, str(game_result))])
        await self.wait_until_input()

    def cleanup(self) -> None:
        logger.info("Cleaning up PongCli terminal interface")
        try:
            self.stdscr.clear()
            self.stdscr.refresh()
            curses.nocbreak()
            self.stdscr.keypad(False)
            curses.echo()
            curses.endwin()
            logger.info("Terminal interface cleanup completed successfully")
        except Exception as e:
            logger.error(f"Error during terminal cleanup: {e}")
            print(f"Error during cleanup: {e}", file=sys.stderr)

class GracefulExit(Exception): pass

async def main() -> None:
    logger.info("=== Starting Pong CLI Application ===")
    # TODO: move network on separate thread
    cli_args: List[str] = sys.argv[1:]
    if len(cli_args) != 1:
        logger.error("Invalid command line arguments")
        print("Usage: ./pong_cli.py <backend_url>", file=sys.stderr)
        sys.exit(1)

    backend_url: str = cli_args[0]
    logger.info(f"Backend URL: {backend_url}")

    try:
        game_client: GameClient = GameClient.from_login(backend_url)
        terminal_ui: PongCli = PongCli(game_client)
        logger.info("Starting application task group")

        async with asyncio.TaskGroup() as tg:
            tg.create_task(game_client.start())
            tg.create_task(game_client.consume_backend_messages())
            tg.create_task(terminal_ui.run())
    except* Exception as exc_group:
        for exc in exc_group.exceptions:
            if not isinstance(exc, GracefulExit):
                logger.error(f"Unhandled exception: {exc}")
                raise
            else:
                logger.info(f"Graceful exit: {exc}")
    finally:
        logger.info("Application shutting down")
        terminal_ui.cleanup()
        await game_client.close()
        print("Exiting Pong CLI...")
        logger.info("=== Pong CLI Application Ended ===")

if __name__ == "__main__":
    asyncio.run(main())
