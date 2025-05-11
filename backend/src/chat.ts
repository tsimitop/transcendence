import { WebSocket } from 'ws';

/**
 * @brief A map of connected users.
 * @key  username, Value: WebSocket connection
 */
export const connectedUsers = new Map<string, WebSocket>();

/**
 * @brief A map of blocked users.
 * @key username, Value: Set of blocked usernames
 */
export const blockedUsers = new Map<string, Set<string>>();

/**
 * @brief Interface representing the shape of incoming chat messages
 */
interface ChatMessage {
  type: string;
  from: string;
  to?: string;
  message?: string;
}

/**
 * @brief Registers a user as connected
 * @param username - The username of the connecting user
 * @param socket - The WebSocket associated with this user
 */
export function registerUser(username: string, socket: WebSocket): void {
  connectedUsers.set(username, socket);
}

/**
 * @brief Removes a user from the list of connected users
 * @param username - The username of the disconnecting user
 */
export function unregisterUser(username: string): void {
  connectedUsers.delete(username);
}

/**
 * @brief Central handler for all incoming WebSocket messages
 * @param senderUsername - The username of the sender
 * @param rawData - The raw WebSocket data received
 */
export function handleChatPayload(senderUsername: string, payload: any): void {
  try {
    // The payload is already parsed in MessageHandler.ts
    const message: ChatMessage = {
      type: payload.type,
      from: senderUsername,
      to: payload.to,
      message: payload.message
    };

    switch (message.type) {
      case 'CHAT':
        handleChatMessage(senderUsername, message);
        break;
      case 'BLOCK':
        handleBlockUser(senderUsername, message);
        break;
      case 'INVITE':
        handleInvite(senderUsername, message);
        break;
      default:
        console.warn(`[CHAT] Unknown message type: ${message.type}`);
    }
  } catch (err) {
    console.error('[CHAT] Failed to process message:', err);
  }
}

/**
 * @brief Broadcasts a message to all connected users (global chat)
 * @param sender - The username of the sender
 * @param messagePayload - Contains the message to broadcast
 */
function handleChatMessage(sender: string, { message }: ChatMessage): void {
  if (!message) return;

  for (const [username, socket] of connectedUsers.entries()) {
    if (socket.readyState !== WebSocket.OPEN) continue;

    socket.send(JSON.stringify({
      type: 'CHAT',
      from: sender,
      message,
    }));
  }
}

/**
 * @brief Adds a user to the block list of another user
 * @param blocker - The username of the blocker
 * @param messagePayload - Contains the username to block
 */
function handleBlockUser(blocker: string, { to }: ChatMessage): void {
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
function handleInvite(sender: string, { to }: ChatMessage): void {
  if (!to) return;

  const recipientSocket = connectedUsers.get(to);
  if (!recipientSocket) {
    console.warn(`[CHAT] Cannot invite ${to}, not connected`);
    return;
  }

  recipientSocket.send(JSON.stringify({
    type: 'INVITE',
    from: sender,
  }));
}
