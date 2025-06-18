import { WebSocket } from "ws";
import { connectedUsers, blockedUsers } from "../../websocket/WebSocket";
import { startPongMatchBetween } from "../pong/PongMsgHandlerGame";
import { currentGames } from '../pong/PongMsgHandler';

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
export function handleChatMessage(sender: string, { to, message }: ChatMessage): void {
	if (!message) return;

	// Private Message
	if (to) {
		const recipientConn = connectedUsers.get(to)?.get('chat');
		const senderConn = connectedUsers.get(sender)?.get('chat');

		// Prevent sending if recipient blocked sender
		if (blockedUsers.get(to)?.has(sender)) {
			console.log(`[CHAT] ${to} has blocked ${sender}. Message not delivered.`);
			return;
		}

		const payload = JSON.stringify({
			type: 'CHAT',
			from: sender,
			to,
			message,
		});

		if (recipientConn?.socket.readyState === WebSocket.OPEN) {
			recipientConn.socket.send(payload);
		}

		if (senderConn?.socket.readyState === WebSocket.OPEN) {
			senderConn.socket.send(payload);
		}

		return;
	}

	// Global Broadcast
	for (const userConnections of connectedUsers.values()) {
		const chatConn = userConnections.get('chat');
		if (chatConn?.socket.readyState === WebSocket.OPEN) {
			chatConn.socket.send(JSON.stringify({
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
export function handleInvite(sender: string, message: ChatMessage): void {
	const { to, from, message: msg } = message;

	if (!to || !from) {
		console.warn("[INVITE] Missing 'to' or 'from' in invite message");
		return;
	}

	if (msg === "ACCEPT") {
		console.log(`[INVITE] ${from} accepted invite from ${to}`);

		if (currentGames.has(from) || currentGames.has(to)) {
			console.warn(`[INVITE] Cannot start game – ${from} or ${to} already in a game`);
			return;
		}

		// start Quick Game
		startPongMatchBetween(from, to);
		return;
	}

	// Sending initial invite
	const userConnections = connectedUsers.get(to);
	const chatSocket = userConnections?.get('chat')?.socket;

	if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
		chatSocket.send(JSON.stringify({
			type: 'INVITE',
			from: sender
		}));
	}
}


