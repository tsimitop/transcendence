#!/usr/bin/env python3

import curses
import time
import sys
import os
import asyncio
from pprint import pprint

from typing import Any, Optional

class BackendClient:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    async def connect(self):
        pass

class PongCli(BackendClient):
    def __init__(self, *, username: str, password: str):
        BackendClient.__init__(self, username=username, password=password)

    @classmethod
    def from_login(cls):
        # show login screen to enter username and password
        username = input("Enter email/username: ")
        password = input("Enter password: ")
        assert username and password, "Username and password cannot be empty"
        return cls(username=username, password=password)

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


def main():
    cli_args = sys.argv[1:]
    if len(cli_args) != 1:
        print("Usage: ./pong_cli.py <backend_url>")
        sys.exit(1)
    terminal_ui = PongCli.from_login()
    asyncio.run(terminal_ui.run())

if __name__ == "__main__":
    main()
    