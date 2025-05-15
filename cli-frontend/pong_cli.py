#!/usr/bin/env python3

import curses
import time
import sys
import os
import asyncio
import ssl 
from pprint import pprint
from typing import Any, Dict, List, Optional, Tuple, Union, cast

import aiohttp
from aiohttp import ClientTimeout, TCPConnector


class BackendClient:
    def __init__(self, username: str, password: str, url: str) -> None:
        self.username: str = username
        self.password: str = password
        self.url: str = url
        self.session: Optional[aiohttp.ClientSession] = None
        self.access_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        self.is_authenticated: bool = False

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
        await self.connect()
        
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
                code_2fa: str = input("Enter your 2FA code: ")
                return await self.validate_2fa(data["user"], code_2fa)
                
            # Store user data and token for future requests
            self.user_data = data["user"]
            self.access_token = data["jwtAccessToken"]
            self.is_authenticated = self.user_data["isSignedIn"]
            
            if self.is_authenticated:
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
            self.is_authenticated = True
            
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
        
            self.is_authenticated = data.get("isSignedIn", False)
            return self.is_authenticated
    
    async def close(self) -> None:
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()

class PongCli(BackendClient):
    def __init__(self, *, username: str, password: str, url: str):
        BackendClient.__init__(self, username=username, password=password, url=url)

    @classmethod
    def from_login(cls, url: Optional[str] = None) -> "PongCli":
        # show login screen to enter username and password
        username = input("Enter email/username: ")
        password = input("Enter password: ")
        if url is None:
            url = input("Enter backend URL: ")
        assert url, "Backend URL cannot be empty"
        assert username and password, "Username and password cannot be empty"
        return cls(username=username, password=password, url=url)

    async def run(self):
        await self.connect()
        while True:
            # find new game
            game_id = self.new_game_screen()
            # run game
            game_result = self.game_screen(game_id)
            # show game result
            self.show_game_result(game_result)

    def new_game_screen(self) -> str:
        """
        Screen which lists available matches and allows to create a new match.
        Returns the game id of the match the user wants to join/created.
        """
        return ""
    
    def game_screen(self, game_id: str) -> dict[str, Any]:
        """
        Screen which shows the game. Returns the game result.
        """
        return {}

    def show_game_result(self, game_result: dict[str, Any]) -> None:
        """
        Show the game result.
        """
        pprint(f"Game result:\n{game_result}")
        input("Press enter to continue with new game...")


async def main():
    # TODO: move network on separate thread
    cli_args = sys.argv[1:]
    if len(cli_args) != 1:
        print("Usage: ./pong_cli.py <backend_url>")
        sys.exit(1)
    
    backend_url = cli_args[0]
    terminal_ui = PongCli.from_login(backend_url)
    try:
        # Authenticate before starting the application
        await terminal_ui.authenticate()
        await terminal_ui.run()
    finally:
    # Ensure we properly close the session on exit
        await terminal_ui.close()
    
    asyncio.run(run_with_auth())

if __name__ == "__main__":
    asyncio.run(main())
