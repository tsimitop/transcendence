# Pong Game API Documentation

This document describes the Pong game API implemented for the Transcendence project, including both REST and WebSocket endpoints.

## Overview

The Pong game system consists of:

1. A server-side game engine that handles game logic, player connections, and state management
2. WebSocket API for real-time communication with the frontend
3. REST API for game creation, listing, and joining

## REST API

### Authentication

All REST endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Create a New Game

```
POST /api/pong/games
```

Request body:
```json
{
  "gameMode": "classic", // only classic for now
  "isPrivate": false,    // Optional: boolean, default is false
  "maxScore": 10         // Optional: number, default is 10 (when the game stops)
}
```

Response:
```json
{
  "game": {
    "id": "string",
    "status": "waiting",
    "ball": {
      "x": 400,
      "y": 300,
      "radius": 10,
      "dx": 0,
      "dy": 0,
      "speed": 5
    },
    "leftPaddle": {
      "x": 20,
      "y": 250,
      "width": 10,
      "height": 100,
      "score": 0,
      "userId": "string",
      "up": false,
      "down": false,
      "speed": 8
    },
    "rightPaddle": {
      "x": 770,
      "y": 250,
      "width": 10,
      "height": 100,
      "score": 0,
      "userId": "",
      "up": false,
      "down": false,
      "speed": 8
    },
    "width": 800,
    "height": 600,
    "lastUpdateTime": 1234567890,
    "gameMode": "classic",
    "isPrivate": false,
    "maxScore": 10
  }
}
```

#### Get Available Games

```
GET /api/pong/games/available
```

Response:
```json
{
  "games": [
    {
      "id": "string",
      "status": "waiting",
      "gameMode": "classic",
      "isPrivate": false,
      "maxScore": 10
    }
  ]
}
```

#### Get Game by ID

```
GET /api/pong/games/:id
```

Response:
```json
{
  "game": {
    "id": "string",
    "status": "waiting",
    "ball": { ... },
    "leftPaddle": { ... },
    "rightPaddle": { ... },
    "width": 800,
    "height": 600,
    "lastUpdateTime": 1234567890,
    "gameMode": "classic",
    "isPrivate": false,
    "maxScore": 10
  }
}
```

#### Join a Game

```
POST /api/pong/games/:id/join
```

Response:
```json
{
  "game": {
    "id": "string",
    "status": "countdown",
    "ball": { ... },
    "leftPaddle": { ... },
    "rightPaddle": { ... },
    "width": 800,
    "height": 600,
    "lastUpdateTime": 1234567890,
    "gameMode": "classic",
    "isPrivate": false,
    "maxScore": 10
  }
}
```

## WebSocket API

### Connecting

Connect to the WebSocket endpoint with your JWT token:

```
ws://localhost:4443/api/ws/pong?token=<jwt_token>
```

### Message Format

All WebSocket messages use the following JSON format:

```json
{
  "type": "string",
  "payload": { ... }
}
```

### Message Types

#### Client → Server

##### Join Game

```json
{
  "type": "join_game",
  "payload": {
    "gameId": "string",
    "userId": "string"
  }
}
```

##### Create Game

```json
{
  "type": "create_game",
  "payload": {
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
  "payload": {
    "userId": "string",  // we implicitly know the user (connection), however the field can become usefull for multiple player on single client scenario. Game id also isn't really required as a user can only be in a single game.
    "up": boolean,    // true for up, false for down
    }
}
```

##### Ping (Keep-Alive)

```json
{
  "type": "ping",
  "payload": {}
}
```

#### Server → Client

##### Game State

```json
{
  "type": "game_state",
  "payload": {
    "game": {
      "id": "string",
      "status": "playing",
      "ball": {
        "x": 400,
        "y": 300,
        "radius": 10,
        "dx": 3,
        "dy": 2,
        "speed": 5
      },
      "leftPaddle": { ... },
      "rightPaddle": { ... },
      "width": 800,
      "height": 600,
      "lastUpdateTime": 1234567890,
      "gameMode": "classic",
      "isPrivate": false,
      "maxScore": 10,
      "countdown": 3 // Only present during countdown
    }
  }
}
```

##### Game Over

```json
{
  "type": "game_over",
  "payload": {
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
  "payload": {
    "message": "string",
    "code": 400
  }
}
```

##### Pong (Keep-Alive Response)

```json
{
  "type": "pong",
  "payload": {}
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