// receives the messages from the websocket handler and calls the appropriate functions (chat or pong game)
import { handleChatPayload } from "../chat";
import { handlePongPayload } from "../api/pong/PongMsgHandler";
import { connectedUsers } from "./WebSocket";


export interface WebsocketApiRequest {
    target_endpoint: string;  // chat-api or pong-api
    payload: any;    // The ChatMessage or Pong request
  }


export function handleWebsocketPayload(senderUsername: string, rawData: any): void {
  try {
    const parsed: WebsocketApiRequest = JSON.parse(rawData.toString());
    console.debug(`got ws message: ${rawData.toString()}`);

    switch (parsed.target_endpoint) {
      case 'chat-api':
        handleChatPayload(senderUsername, parsed.payload);
        break;
      case 'pong-api':
        handlePongPayload(senderUsername, parsed.payload);
        break;
      case 'ping':
          const socket = connectedUsers.get(senderUsername);
          if (socket) {
              const pong_msg: WebsocketApiRequest = {
                target_endpoint: "pong",
                payload: {},
              }
              socket.send(JSON.stringify(pong_msg));
          } else {
              console.debug(`[PONG WS] User ${senderUsername} not connected, cant send message`);
          }
          break;
      default:
        console.warn(`[WS] Unknown message type: ${parsed.target_endpoint}`);
        console.warn(`[WS] message: ${rawData}`)
    }
  } catch (err) {
    console.error('[WS] Failed to parse message:', err);
  }
}
