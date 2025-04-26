# Pong Game API Specification

## WebSocket API

### Establishing Connection

Connect to the WebSocket endpoint provided in the REST API responses with the authentication token:

```
ws://server.url/games/socket?token={auth_token}&gameId={game_id}
```

### Message Format

All WebSocket messages use the following JSON format:

```json
{
  "type": "string",
  "payload": {}  // Object with type-specific data
}
```

### Client → Server Messages

#### Player Ready

```json
{
  "type": "player_ready"
}
```

#### Player Input

```json
{
  "type": "player_input",
  "payload": {
    "paddlePosition": "float",  // Position from 0 to 1
    "input": "string"  // "up", "down", or "stop"
  }
}
```

#### Pause Request

```json
{
  "type": "pause_request"
}
```

#### Leave Game

```json
{
  "type": "leave_game"
}
```

### Server → Client Messages

#### Game State Update

```json
{
  "type": "game_state",
  "payload": {
    "ball": {
      "position": {
        "x": "float",
        "y": "float"
      },
      "velocity": {
        "x": "float",
        "y": "float"
      }
    },
    "players": [
      {
        "id": "integer",
        "position": "float",  // Position from 0 to 1
        "score": "integer"
      }
    ],
    "gameStatus": "string"  // "waiting", "countdown", "playing", "paused", "finished"
  }
}
```


#### Game Result

```json
{
  "type": "game_result",
  "payload": {
    "winner": {
      "id": "integer",
      "username": "string",
      "score": "integer"
    },
    "loser": {
      "id": "integer",
      "username": "string",
      "score": "integer"
    },
    "duration": "integer",  // seconds
    "stats": {
      "rankChange": "integer",
      "experienceGained": "integer"
    }
  }
}
```

<!-- #### Chat Message Broadcast

```json
{
  "type": "chat_message",
  "payload": {
    "userId": "integer",
    "username": "string",
    "message": "string",
    "timestamp": "timestamp"
  }
} -->
<!-- ``` -->


<!-- #### Player Disconnected

```json
{
  "type": "player_disconnected",
  "payload": {
    "playerId": "integer",
    "username": "string",
    "reconnectWindow": "integer"  // Seconds to wait for reconnect
  }
}
```

#### Player Reconnected

```json
{
  "type": "player_reconnected",
  "payload": {
    "playerId": "integer",
    "username": "string"
  }
}
``` -->

#### Error Message

```json
{
  "type": "error",
  "payload": {
    "code": "string",
    "message": "string"
  }
}
```

## Game States

- **waiting**: Waiting for players to join and get ready
- **countdown**: Game is about to start, countdown in progress
- **playing**: Game is in progress
- **paused**: Game is temporarily paused
- **finished**: Game has ended

## Implementation Recommendations

1. The server should send game state updates at a fixed rate (e.g., 30-60 times per second).
2. Clients should implement interpolation to render smooth animations.
4. Implement a reconnection mechanism to handle temporary disconnections.
5. Use token-based authentication for all API and WebSocket connections.
6. Include rate limiting to prevent abuse.
7. Store game results and statistics in a database for history and leaderboards.
