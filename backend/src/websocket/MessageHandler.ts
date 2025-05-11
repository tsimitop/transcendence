// receives the messages from the websocket handler and calls the appropriate functions (chat or pong game)
import { handleChatPayload } from "../chat";
import { handlePongPayload } from "../api/pong/PongMsgHandler";


interface WebsocketApiRequest {
    target_endpoint: string;  // chat-api or pong-api
    payload: any;    // The ChatMessage or Pong request
  }


export function handleWebsocketPayload(senderUsername: string, rawData: any): void {
  try {
    const parsed: WebsocketApiRequest = JSON.parse(rawData.toString());

    switch (parsed.target_endpoint) {
      case 'chat-api':
        handleChatPayload(senderUsername, parsed.payload);
        break;
      case 'pong-api':
        handlePongPayload(senderUsername, parsed);
        break;
      default:
        console.warn(`[WS] Unknown message type: ${parsed.target_endpoint}`);
    }
  } catch (err) {
    console.error('[WS] Failed to parse message:', err);
  }
}
