import {PongMessage, PongErrorData, KeyboardInputData, LocalGame, CreateGameData} from './PongMessages';
import { connectedUsers } from '../../websocket/WebSocket';
import { PongGame } from './PongGame';
import { JoinGameData } from './PongMessages';


const currentGames: Map<string, PongGame> = new Map(); // player -> game


export function endGameWithuser(user: string) {
  for (const [username, game] of currentGames.entries()) {
    if(user === game.getlPlayerName() || user === game.getrPlayerName()) {
      game.setGameState("finished");

      const response = {
        target_endpoint: 'pong-api',
        type: 'game_over',
        pong_data: {
          gameId: game.getUniqeID(),
          winnerId: "string",
          message: "WIN THROUGH DISSCONNETION",
          finalScore: {
            left: game.getlPlayerScore(),
            right: game.getrPlayerScore()
        }
        }
      }
      const lsocket = game.getlPlayerSocket();
      const rsocket = game.getrPlayerSocket();
      currentGames.delete(username);
      if (lsocket || lsocket.readyState === WebSocket.OPEN){
        console.log("message l player");
        lsocket.send(JSON.stringify(response));
      }
      if (rsocket || rsocket.readyState === WebSocket.OPEN){
        console.log("message r player");
        rsocket.send(JSON.stringify(response));
      }
    }
    console.log(`Game with key ${username} removed from currentGames`);
    break;
  }
}




export function handlePongPayload(senderUsername: string, payload: any): void {
  try {
    console.error("|\n| THIS IS AN INPUT\nV");
    console.error("payload:", payload);

    // The payload is already parsed in MessageHandler.ts
    const message: PongMessage = {
      type: payload.type,
      pong_data: payload.pong_data,
    };

    switch (message.type) {
      case 'input':
        handleInput(senderUsername, message.pong_data);
        break;
      case 'game_list':
        handleListGames(senderUsername);
        break;
      case 'join_game':
        handlerJoinGame(senderUsername, message.pong_data);
        break;
      case 'create_game':
        handleCreateGame(senderUsername, message.pong_data);
        break;
      case 'getGames':
        handleGetGames(senderUsername);
        break;
      // case 'create_game':  // mhhh mixed case types
      //   handleCreateGame(senderUsername, message.pong_data);
      //   break;
      default:
        sendErrorMessage(senderUsername, `Unknown message type: ${message.type}`, 4001);
        console.warn(`[PONG WS] Unknown message: ${message}`);
    }
  } catch (err) {
    console.error(`[PONG WS] Failed to process message ${payload}:`, err);
  }
}

function sendMessage(senderUsername: string, type: string, pong_data: any): void {
    // used to send messages to the client
    const message: PongMessage = {
        type: type,
        pong_data: pong_data,
    };
    // const wrapped_msg: WebsocketApiRequest = {
    //   target_endpoint: "pong-api",
    //   payload: message
    // }

    // const socket = connectedUsers.get(senderUsername);
    // if (socket) {
    //     socket.send(JSON.stringify(wrapped_msg));
    // } else {
    //     console.debug(`[PONG WS] User ${senderUsername} not connected, cant send message`);
    // }
}

function sendErrorMessage(senderUsername: string, errorMessage: string, errorCode: number = 69420): void {
    // used to send error messages to the client

    const errorData: PongErrorData = {
        message: errorMessage,
        code: errorCode,  // do we really need this?
    };
    sendMessage(senderUsername, 'error', errorData);
    console.debug(`[PONG WS] Error message sent to ${senderUsername}: ${errorMessage} (code: ${errorCode})`);
}

/*****************************************************/
/************** ajehles Methods  *********************/
/*****************************************************/
function handleInput(senderUsername: string, pong_data: KeyboardInputData): void {
    
  
  console.log(pong_data);


}

function handlerJoinGame(senderUsername: string, pong_data: JoinGameData): void {
  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  let opponent: string = "";
  console.log("game id", pong_data);
  for (const [username, game] of currentGames.entries()) {
    if(pong_data.gameId === game.getUniqeID()){
      game.setGameState('countdown');
      game.setOpponentName(senderUsername, pong_data.OpponentAlias);
      opponent = username;
      break;
    }
  }
  console.log("opponent ", opponent);
  const opponentSocket = connectedUsers.get(opponent);
  if (!opponentSocket || opponentSocket.readyState !== WebSocket.OPEN) return;
  const response = {
    target_endpoint: 'pong-api',
    type: 'countdown',
    value : '3'
  };
  
  console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
  opponentSocket.send(JSON.stringify(response));

  // set sockets to current instance
  currentGames.get(opponent)?.setSockets(senderSocket, opponentSocket);
  

  
    let countdown = 3;
    const interval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(interval);
      for (const [username, game] of currentGames.entries()) {
        if(pong_data.gameId === game.getUniqeID()){
          game.setGameState('playing');
          opponent = username;
          break; 
        }
      }
      startGameLoop(currentGames.get(opponent)!);



      setTimeout(() => {
      }, 1000);
    } else {
      const response = {
        target_endpoint: 'pong-api',
        type: 'countdown',
        value : countdown
      };
      senderSocket.send(JSON.stringify(response));
      opponentSocket.send(JSON.stringify(response));
    }
  }, 1000);
}


function startGameLoop(game: PongGame) {
  const fps = 30;
  const intervalMs = 1000 / fps;

  console.log()
  const intervalId = setInterval(() => {
     
      if (game.getGameState() === 'finished') {
        clearInterval(intervalId);
        console.log(`Game ${game.getUniqeID()} ended.`);
        return;
    }

    // console.log("game update is running");
    game.update();

    // Broadcast the updated game state to players
    const gameState = game.getGameStatePayload();

    
    const response = {
          target_endpoint: 'pong-api',
          type: 'game_state',
          game: {
            id: game.getUniqeID(),
            status: 'playing',
            ball: {
                x: gameState.game.ball.x,  // floats as string
                y: gameState.game.ball.y,  // top left corner is (0/0)
            },
            leftPaddle: {
                topPoint: {
                    x: 0,
                    y: 0.5,
                },
                height: 0.2,  // percentage of window height (0-1)
              },
              rightPaddle: {
              topPoint: {
                  x: 0.9,
                  y: 0.5,
              },
              height: 0.2,  // percentage of window height (0-1)
            },
            lastUpdateTime: 1,
            maxScore: 10,
            scores: {
                ["playerId: string"]: 1,  // player IDs mapped to their scores
            },
            countdown: 1,
      }
  };

  const lPlayerSocket = game.getlPlayerSocket();
  const rPlayerSocket = game.getrPlayerSocket();
  
  if (lPlayerSocket && lPlayerSocket.readyState === WebSocket.OPEN) {
    lPlayerSocket.send(JSON.stringify(response));
  }
  if (rPlayerSocket && rPlayerSocket.readyState === WebSocket.OPEN) {
    rPlayerSocket.send(JSON.stringify(response));
  }
  
  // console.log(`[GAMELOOP] Sending state for game ${game.getUniqeID()}`);
  // console.log(`[GAMELOOP] lPlayerSocket:`, !!lPlayerSocket, lPlayerSocket?.readyState);
  // console.log(`[GAMELOOP] rPlayerSocket:`, !!rPlayerSocket, rPlayerSocket?.readyState);
  


  }, intervalMs);
}





function handleListGames(senderUsername: string): void {
  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  const gameList = [];

  for (const [username, game] of currentGames.entries()) {
    gameList.push({
      id: game.getUniqeID(),
      owner: username,
      state: game.getGameState(),
      // optionally include player names, number of players, etc. tournament?
    });
  }
  
  const response = {
    target_endpoint: 'pong-api',
    type: 'game_list',
    games: gameList,
  };
  
  console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
}



function handleCreateGame(senderUsername: string, pong_data: CreateGameData): void {

  console.log(pong_data.gameMode);
  const uniqueGameID = `${senderUsername}-${Date.now()}`;
  const newGame = new PongGame(uniqueGameID, senderUsername, pong_data.playerAlias);
  currentGames.set(senderUsername, newGame);

  const senderSocket = connectedUsers.get(senderUsername);
  if(pong_data.gameMode === "remote"){
    if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
      const response = {
        target_endpoint: 'pong-api',
        type: 'game_created',
        gameId: uniqueGameID
      };
      senderSocket.send(JSON.stringify(response));
    }
    // console.log(`Game created by ${senderUsername} with ID: ${uniqueGameID}`);
    return;
  }
  else {
    // LOCAL GAME
    newGame.setOpponentName(pong_data.localOpponent, pong_data.localOpponent);
    newGame.setGameState("countdown");
    if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;


/********* */
// jsut for local testing
newGame.setSockets(senderSocket, senderSocket);
/********* */

    const response = {
      target_endpoint: 'pong-api',
      type: 'countdown',
      value : '3'
    };
    console.log("response:", response); 
    senderSocket.send(JSON.stringify(response));
    


    let countdown = 3;
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        newGame.setGameState("playing")
        startGameLoop(newGame);
      }
    }, 1000);
  }
}


  
   /*****************************************************/
  /************** ajehles Methods end *********************/
  /*****************************************************/



function handleKeyboardInput(senderUsername: string, message: KeyboardInputData): void {
  const { userId, up } = message;
  if (userId !== senderUsername) {
    console.warn(`[PONG] User ID mismatch: expected ${senderUsername}, got ${userId}`);
    sendErrorMessage(senderUsername, `User ID mismatch, you trying to cheat?`, 4002);
    return;
  }

  // TODO: pass to engine

  // Handle keyboard input
  console.debug(`[PONG] Keyboard input from ${userId}: ${up ? 'UP' : 'DOWN'}`);
}

function handleGetGames(senderUsername: string): void {
  console.debug(`[PONG] user ${senderUsername} requested games`);
  
  // dummy waiting game for testing the 'lobby'
  // TODO: Implement return of actual waiting games list
  // const dummy_game: GameStateData = {
  //   game: {
  //     id: "game-123456",
  //     status: "waiting",
  //     ball: {
  //       x: "0.0",
  //       y: "0.0"
  //     },
  //     leftPaddle: {
  //       topPoint: {
  //         x: 0.05,
  //         y: 0.35
  //       },
  //       height: 0.2
  //     },
  //     rightPaddle: {
  //       topPoint: {
  //         x: 0.95,
  //         y: 0.40
  //       },
  //       height: 0.2
  //     },
  //     lastUpdateTime: Date.now(),
  //     maxScore: 10,
  //     scores: {
  //       "player1": 3,
  //       "player2": 5
  //     },
  //     countdown: 0
  //   }
  // };
  
  // TODO add all games into this list, then pass the list to sendMessages
  // const waiting_games: GameStateData[] = [dummy_game];
 
  // sendMessage(senderUsername, 'game_states', waiting_games);
  // console.debug(`returning ${waiting_games.length} games`)
}

// function handleCreateGame(senderUsername: string, pong_data: CreateGameData): void {
//   console.log(`got create game ${pong_data}`)
// }