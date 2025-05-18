import {PongMessage, PongErrorData, KeyboardInputData, LocalGame} from './PongMessages';
import { connectedUsers } from '../../websocket/WebSocket';
import { PongGame } from './PongGame';


const waitingPlayers: string[] = [];
const activeGames: Map<string, PongGame> = new Map(); // player -> game


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
      case 'list_games':
        handleListGames(senderUsername, payload);
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

function handleListGames(senderUsername: string, pong_data: LocalGame): void {
  
  for (const [username, socket] of connectedUsers.entries()) {
    if (socket.readyState !== WebSocket.OPEN) continue;

    console.log("Sending message to:", username);
    console.log("Socket readyState:", socket.readyState);
  socket.send(JSON.stringify({
    type: 'CHAT',
    from: "backend"
  }));
  }
}


function handleCreateGame(senderUsername: string, pong_data: LocalGame): void {
  
  for (const [username, socket] of connectedUsers.entries()) {
    if (socket.readyState !== WebSocket.OPEN) continue;

    console.log(pong_data);
    if(pong_data.mode === 'local')
      console.log("LOCAL");
    if(pong_data.mode === 'remote')
      console.log("REMOTE");
    else
      console.log("NO LOCAL");

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
  console.debug(`[CHAT] Keyboard input from ${userId}: ${up ? 'UP' : 'DOWN'}`);
}


