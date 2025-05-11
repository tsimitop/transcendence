import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';

import { registerUser, unregisterUser } from '../chat';
import { handleWebsocketPayload } from './MessageHandler';

// Load environment variables from .env file
dotenv.config();

// Set the JWT secret from environment variables
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;

/**
 * @brief Starts the WebSocket server and handles incoming socket connections.
 * @param server - The HTTP/HTTPS server to bind WebSocket to.
 * @note In development mode (e.g., with Vite + HMR), this handler may be called
 * multiple times as the frontend reloads. This results in repeated
 * `[WS] User connected` and `[WS] User disconnected` log messages.
 * This is expected during development and does not occur in production.
 */
export function startWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const token = getTokenFromRequest(req);

    // Reject connection if no token
    if (!token) {
      socket.close(4001, 'Missing Token');
      return;
    }

	// Verify the token and extract the username
    let username: string;
    try {
      const decoded = verify(token, JWT_SECRET) as { userId: string, username: string };
      username = decoded.username;
    } catch (err) {
      socket.close(4002, 'Invalid Token');
      return;
    }

	// Check if the user is already connected
    console.log(`[WS] User connected: ${username}`);

    // Register the user to the active sockets map
    registerUser(username, socket);

    // Handle incoming messages
    socket.on('message', (data) => {
      handleWebsocketPayload(username, data);
    });

    // Handle socket close event
    socket.on('close', () => {
      console.log(`[WS] User disconnected: ${username}`);
      unregisterUser(username);
    });

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'SYSTEM',
      message: `Welcome ${username}!`
    }));
  });
}

/**
 * @brief Extracts the JWT token from the incoming WebSocket upgrade request.
 * @param req - The incoming HTTP upgrade request.
 * @returns The JWT token if present, or null.
 */
function getTokenFromRequest(req: IncomingMessage): string | null {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  return url.searchParams.get('token');
}
