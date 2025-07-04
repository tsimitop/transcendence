import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';
import UserDb from "../user-database/UserDb";
import { handleWebsocketPayload } from './MessageHandler';
import { endOfGame, endOfGame2 } from '../api/pong/PongMsgHandler';
import { deleteGameBecauseUserReconnected } from '../api/pong/PongMsgHandler';
import { QueryFriend } from '../user-database/friend-queries';
import { QueryUser } from '../user-database/queries';

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
  if (chatConnection) {
    return chatConnection.socket;
    } else {
    return undefined;
  }
}


export function getPongSocket(username: string): WebSocket | undefined {
  const userConnections = connectedUsers.get(username);
  if (!userConnections) return undefined;

  const pongConnection = userConnections.get('pong');
  return pongConnection?.socket;
}


export const blockedUsers = new Map<string, Set<string>>();

/**
 * @brief Loads blocked users from the database into memory
 * @description This function retrieves all blocked user relationships from the database
 * and stores them in a Map where the key is the blocker username and the value is a Set of blocked usernames.
 */
export function loadBlockedUsersFromDatabase() {
  const userDbInstance = new UserDb("database/test.db");
  const db = userDbInstance.openDb();

  const stmt = db.prepare(QueryFriend.LIST_ALL_BLOCKED);

  const rows = stmt.all() as { user_id: number, blocked_user_id: number }[];

  const getUsername = db.prepare(`SELECT username FROM test_users WHERE id = ?`);

  for (const { user_id, blocked_user_id } of rows) {
	const blockerRow = getUsername.get(user_id) as { username: string } | undefined;
	const blockedRow = getUsername.get(blocked_user_id) as { username: string } | undefined;

	const blocker = blockerRow?.username;
	const blocked = blockedRow?.username;

    if (!blocker || !blocked) continue;

    if (!blockedUsers.has(blocker)) {
      blockedUsers.set(blocker, new Set());
    }
    blockedUsers.get(blocker)!.add(blocked);
  }

  db.close();
//   console.log(`[INIT] Loaded blocked users into memory`);
}



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

    const url = new URL(req.url || '', `http://${req.headers.host}`);

    const connectionType = (url.searchParams.get('type')) as 'pong' | 'chat';
    if (!connectionType) {
      socket.close(4004, 'Missing Connection Type');
      return;
    }

    console.log(`[WS] User connected: ${username} (type: ${connectionType})`);
	broadcastOnlineStatus(username, true);

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
      broadcastOnlineStatus(username, false);
	  unregisterUser(username, connectionType);

      // Only end games for pong connections
      if (connectionType === 'pong') {
        endOfGame2(username, "WIN THROUGH DISSCONNETION");
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


export function broadcastOnlineStatus(username: string, isOnline: boolean): void {
  const userDbInstance = new UserDb("database/test.db");
  const db = userDbInstance.openDb();

  const getUserId = db.prepare(QueryUser.FIND_ID_BY_USERNAME);
  const userRow = getUserId.get(username) as { id: number } | undefined;
  if (!userRow) {
    db.close();
    return;
  }

  const stmt = db.prepare(QueryFriend.LIST_OF_ACCEPTED);
  const friends = stmt.all(userRow.id, userRow.id) as { friend_id: number }[];

  const getUsername = db.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);

  for (const friend of friends) {
    const friendRow = getUsername.get(friend.friend_id) as { username: string } | undefined;
    if (!friendRow?.username) continue;

    const ws = getUserSocket(friendRow.username);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "FRIENDSHIP_UPDATE",
        friend: username,
        online: isOnline
      }));
    }
  }

  db.close();
}
