import {PongMessage, PongErrorData, KeyboardInputData} from './PongMessages';
import { connectedUsers } from '../../websocket/WebSocket';

export function handlePongPayload(senderUsername: string, payload: any): void {
  try {
    // The payload is already parsed in MessageHandler.ts
    const message: PongMessage = {
      type: payload.type,
      pong_data: payload.pong_data,
    };

    console.error("\nTHIS IS AN INPUT\n");
    console.error(message.type);
    
    switch (message.type) {
      case 'input':
        handleKeyboardInput(senderUsername, message.pong_data);
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


