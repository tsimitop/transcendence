import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';
import UserDb from "../user-database/UserDb";
import { handleWebsocketPayload } from './MessageHandler';

import { endOfGame } from '../api/pong/PongMsgHandler';
import { deleteGameBecauseUserReconnected } from '../api/pong/PongMsgHandler';

// Load environment variables from .env file
dotenv.config();

// Set the JWT secret from environment variables
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;

interface UserConnection {
  socket: WebSocket;
  type: 'chat' | 'pong';
  connectedAt: Date;
}

export const connectedUsers = new Map<string, Map<string, UserConnection>>();

export function getUserSocket(username: string): WebSocket | undefined {
  const userConnections = connectedUsers.get(username);
  if (!userConnections || userConnections.size === 0) return undefined;

  // Prefer chat connection, fallback to any available connection
  const chatConnection = userConnections.get('chat');
  if (chatConnection) return chatConnection.socket;

  // Return first available connection
  const firstConnection = userConnections.values().next().value;
  return firstConnection?.socket;
}


export function getPongSocket(username: string): WebSocket | undefined {
  const userConnections = connectedUsers.get(username);
  if (!userConnections) return undefined;

  const pongConnection = userConnections.get('pong');
  return pongConnection?.socket;
}


export const blockedUsers = new Map<string, Set<string>>();


export function startWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const token = getTokenFromRequest(req);

    // Reject connection if no token
    if (!token) {
      socket.close(4001, 'Missing Token');
      console.error("unauthenticated ws request")
      return;
    }

	// Verify the token and extract the username
    let userId: string;
    try {
		const decoded = verify(token, JWT_SECRET) as { userId: string };
		userId = decoded.userId;
	  } catch (err) {
		socket.close(4002, 'Invalid Token');
		return;
	  }

	  const userDbInstance = new UserDb("database/test.db");
	  const userDb = userDbInstance.openDb();

	  const username = userDbInstance.findUsernameByUserId(userDb, userId);
	  if (!username) {
		socket.close(4003, 'User Not Found');
		return;
	  }

    // Extract connection type from query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const connectionType = url.searchParams.get('type') as 'chat' | 'pong';

	  // Check if the user is already connected
    console.log(`[WS] User connected: ${username} (type: ${connectionType})`);

    // Only delete running games for pong connections
    if (connectionType === 'pong') {
      deleteGameBecauseUserReconnected(username);
    }

    // Register the user to the active sockets map
    registerUser(username, socket, connectionType);

    // Handle incoming messages
    socket.on('message', (data) => {
	  handleWebsocketPayload(username, data);
    });

    // Handle socket close event
    socket.on('close', () => {
      console.log(`[WS] User disconnected: ${username} (type: ${connectionType})`);
      unregisterUser(username, connectionType);

      // Only end games for pong connections
      if (connectionType === 'pong') {
        endOfGame(username, "WIN THROUGH DISSCONNETION");
      }
    });

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'SYSTEM',
      message: `Welcome ${username}!`
    }));
  });
}


function getTokenFromRequest(req: IncomingMessage): string | null {
  // WebSocket connections don't automatically send cookies, so we primarily rely on query parameters
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const queryToken = url.searchParams.get('token');
  
  if (queryToken) {
    return queryToken;
  }
  
  // Fallback: try to get token from cookies (in case browser supports it)
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.accesstoken) {
      return cookies.accesstoken;
    }
  }
  
  return null;
}


export function registerUser(username: string, socket: WebSocket, type: 'chat' | 'pong' = 'chat'): void {
  if (!connectedUsers.has(username)) {
    connectedUsers.set(username, new Map());
  }

  const userConnections = connectedUsers.get(username)!;
  userConnections.set(type, {
    socket,
    type,
    connectedAt: new Date()
  });
}


export function unregisterUser(username: string, type: 'chat' | 'pong' = 'chat'): void {
  const userConnections = connectedUsers.get(username);
  if (!userConnections) return;

  userConnections.delete(type);

  // If no connections remain, remove the user entirely
  if (userConnections.size === 0) {
    connectedUsers.delete(username);
  }
}