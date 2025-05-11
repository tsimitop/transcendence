# Pong Game API Documentation

This document describes the Pong game API implemented for the Transcendence project, including both REST and WebSocket endpoints.

## Overview

The Pong game system consists of:

1. A server-side game engine that handles game logic, player connections, and state management
2. WebSocket API for real-time communication with the frontend

## WebSocket API

### Connecting

Connect to the WebSocket endpoint with your JWT token:

```
ws://localhost:4443/api/ws/pong?token=<jwt_token>
```

### Message Format

All WebSocket requests and responses use the following JSON format:
```json
{
  "target_endpoint": "pong-api",
  "payload": {
      // the requests listed below, nested in "payload"
      "type": "string",
      "pong_data": { ... }
  }
}
```
Except maybe for the Ping/pong message, its not pong-api specific, we could call it target_endpoint: "global"

### Message Types

#### Client → Server

#### Get Available Games

Request:
{
  "type": "getGames",
  "pong_data": {}
}

Response:
```json
{
  "games": [
    // list of game_state of all games 
    {
      game_states
    }
  ]
}
```

#### Get Game by ID

Request
{
  "type": "gameByID",
  "pong_data": {
    "id": "stringid"
  }
}

Response:
game_state response or error

#### Join a Game

request:
{
  "type": "joinGame",
  "pong_data": {
    "id": "gameidstr"
  }
}

Response:
```json
game_state response or error

##### Create Game

```json
{
  "type": "create_game",
  "pong_data": {
    "userId": "string",
    "gameMode": "classic", // Optional: "classic", "speed", or "chaos"
    "isPrivate": false,    // Optional: boolean
    "maxScore": 10         // Optional: number
  }
}
```

##### Player Input
What is "up"/"down" though? What if the user keeps up pressed? Let's define a single "up" as a press of at most X ms, if the user keeps the button pressed > X ms a new "input" is sent and the timer is reset.
Which X is good? Depends on latency of the connection i guess?

```json
{
  "type": "input",
  "pong_data": {
    "userId": "string",  // we implicitly know the user (connection), however the field can become usefull for multiple player on single client scenario. Game id also isn't really required as a user can only be in a single game.
    "up": boolean,    // true for up, false for down
    }
}
```

##### Ping (Keep-Alive)

```json
{
  "type": "ping",
  "pong_data": {}
}
```

#### Server → Client

##### Game State

```json
{
  "type": "game_state",
  "pong_data": {
    "game": {
      "id": "string",
      "status": "playing",
      "ball": {
        // frontend has to calculate the direction of the ball
        // from the previous coordinates and the new coordinates
        // ball speed is constant
        "x": "0.000",  // floats as string
        "y": "0.000",  // top left corner is (0/0)
      },
      "leftPaddle": { 
          "topPoint": {
            "x": 0.2,
            "y": 0.2,
          }
          "height": 0.1, // 1 is the whole height of the window, so 10% of the width
      },  // we interpret the paddle as 2D object (a line), which is the line on which the ball will bounce of, how its rendered in 3d is up to the frontend?
      // does this make sense?
      "rightPaddle": { ... },
      "lastUpdateTime": 1234567890,
      "gameMode": "classic",
      "isPrivate": false,
      "maxScore": 10,
      "scores": {
        "playerids...": int, //score
      }
      "countdown": 3, // Only relevant during countdown
    }
  }
}
```

##### Game Over

```json
{
  "type": "game_over",
  "pong_data": {
    "gameId": "string",
    "winnerId": "string",
    "finalScore": {
      "left": 10,
      "right": 8
    }
  }
}
```

##### Error

```json
{
  "type": "error",
  "pong_data": {
    "message": "string",
    "code": 400
  }
}
```

##### Pong (Keep-Alive Response)

```json
{
  "type": "pong",
  "pong_data": {}
}
```

## Game Modes

### Classic

Standard Pong game with consistent ball speed.

## Game States

- **waiting**: Waiting for a second player to join
- **countdown**: Countdown before the game starts (3, 2, 1)
- **playing**: Game is in progress
- **paused**: Game is paused
- **finished**: Game is finished (one player reached the maximum score)

## Implementation Notes

1. The server sends game state updates at approximately 30fps (~33ms intervals)
2. Players control their paddles using the arrow keys or W/S keys
3. The game engine uses a simple physics system with collision detection
4. Games are automatically removed from the server a few seconds after they finish
5. All WebSocket connections are authenticated using JWT tokens
6. The server handles player disconnections gracefully