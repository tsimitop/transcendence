import {PongMessage, PongErrorData, KeyboardInputData, LocalGame} from './PongMessages';
import { connectedUsers } from '../../websocket/WebSocket';
import { PongGame } from './PongGame';
import { JoinGameData } from './PongMessages';


const waitingPlayers: string[] = [];
const currentGames: Map<string, PongGame> = new Map(); // player -> game


export function handlePongPayload(senderUsername: string, payload: any): void {
  try {
    console.error("|\n| THIS IS AN INPUT\nV");
    console.error("payload:", payload.type);

    // The payload is already parsed in MessageHandler.ts
    // const message: PongMessage = {
    //   type: payload.type,
    //   pong_data: payload.pong_data,
    // };

    const message: PongMessage = payload;    
    switch (payload.type) {
      case 'game_list':
        handleListGames(senderUsername, payload);
        break;
      case 'join_game':
        handlerJoinGame(senderUsername, payload);
        break;
      case 'create_game':
        handleCreateGame(senderUsername, payload);
        break;
      default:
        sendErrorMessage(senderUsername, `Unknown message type: ${message.type}`, 4001);
        console.warn(`[PONG WS] Unknown message type: ${message.type}`);
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
    
    const socket = connectedUsers.get(senderUsername);
    if (socket) {
        socket.send(JSON.stringify(message));
    } else {
        console.debug(`[PONG WS] User ${senderUsername} not connected, cant send message`);
    }
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

function handlerJoinGame(senderUsername: string, pong_data: JoinGameData): void {
  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  console.log(pong_data);

}

function handleListGames(senderUsername: string, pong_data: LocalGame): void {
  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  const gameList = [];

  for (const [username, game] of currentGames.entries()) {
    gameList.push({
      id: game.getUniqeID(),
      owner: username,
      state: game.getGameState(),
      // optionally include player names, number of players, etc.
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



function handleCreateGame(senderUsername: string, pong_data: LocalGame): void {

  const uniqueGameID = `${senderUsername}-${Date.now()}`;
  const newGame = new PongGame(uniqueGameID);
  currentGames.set(senderUsername, newGame);

  // Step 4: Notify the creator (if socket exists and is open)
  const senderSocket = connectedUsers.get(senderUsername);
  if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
    const response = {
      type: 'game_created',
      gameId: uniqueGameID,
      status: 'waiting',
    };
    senderSocket.send(JSON.stringify(response));
  }

  console.log(`Game created by ${senderUsername} with ID: ${uniqueGameID}`);
}


// console.log(pong_data);
// if(pong_data.mode === 'local')
//   console.log("LOCAL");
// if(pong_data.mode === 'remote')
//   console.log("REMOTE");
// else
//   console.log("NO LOCAL");




  
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
  console.debug(`[CHAT] Keyboard input from ${userId}: ${up ? 'UP' : 'DOWN'}`);
}


