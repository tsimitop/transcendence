import { WebSocket } from "ws";
import { connectedUsers, blockedUsers } from "../../websocket/WebSocket";

/**
 * @brief Interface representing the shape of incoming chat messages
 */
export interface ChatMessage {
  type: string;
  from: string;
  to?: string;
  message?: string;
}

/**
 * @brief Broadcasts a message to all connected users (global chat)
 * @param sender - The username of the sender
 * @param messagePayload - Contains the message to broadcast
 */
export function handleChatMessage(sender: string, { message }: ChatMessage): void {
  if (!message) return;

  for (const [username, userConnections] of connectedUsers.entries()) {
    // Send to chat connections only
    const chatConnection = userConnections.get('chat');
    if (chatConnection && chatConnection.socket.readyState === WebSocket.OPEN) {
      chatConnection.socket.send(JSON.stringify({
        type: 'CHAT',
        from: sender,
        message,
      }));
    }
  }
}

/**
 * @brief Adds a user to the block list of another user
 * @param blocker - The username of the blocker
 * @param messagePayload - Contains the username to block
 */
export function handleBlockUser(blocker: string, { to }: ChatMessage): void {
  if (!to) return;

  if (!blockedUsers.has(blocker)) {
    blockedUsers.set(blocker, new Set());
  }

  blockedUsers.get(blocker)!.add(to);
  console.log(`[CHAT] ${blocker} blocked ${to}`);
}

/**
 * @brief Sends an invite message to a specific user
 * @param sender - The username sending the invite
 * @param messagePayload - Contains the username to invite
 */
export function handleInvite(sender: string, { to }: ChatMessage): void {
  if (!to) return;

  const userConnections = connectedUsers.get(to);
  if (!userConnections) {
    console.warn(`[CHAT] Cannot invite ${to}, not connected`);
    return;
  }

  // Send invite to chat connection if available
  const chatConnection = userConnections.get('chat');
  if (chatConnection && chatConnection.socket.readyState === WebSocket.OPEN) {
    chatConnection.socket.send(JSON.stringify({
      type: 'INVITE',
      from: sender,
    }));
  } else {
    console.warn(`[CHAT] Cannot invite ${to}, no active chat connection`);
  }
}
