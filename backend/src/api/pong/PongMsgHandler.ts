

export function handlePongPayload(senderUsername: string, payload: any): void {
  try {
    // The payload is already parsed in MessageHandler.ts
    // const message: ChatMessage = {
    //   type: payload.type,
    //   from: senderUsername,
    //   to: payload.to,
    //   message: payload.message
    // };

    // switch (message.type) {
    //   case 'CHAT':
    //     handleChatMessage(senderUsername, message);
    //     break;
    //   case 'BLOCK':
    //     handleBlockUser(senderUsername, message);
    //     break;
    //   case 'INVITE':
    //     handleInvite(senderUsername, message);
    //     break;
    //   default:
    //     console.warn(`[CHAT] Unknown message type: ${message.type}`);
    // }
  } catch (err) {
    console.error('[CHAT] Failed to process message:', err);
  }
}