import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    websocketClients?: Set<{
      username: string;
      send: (data: string) => void;
    }>;
  }
}

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import crypto from "crypto";
import fs from "fs";
import { loadBlockedUsersFromDatabase, startWebSocketServer } from "./websocket/WebSocket";
import { SESSION_COOKIE_NAME } from "./constants";
import UserDb from "./user-database/UserDb";
import { QueryFriend } from "./user-database/friend-queries";
import { QueryUser } from "./user-database/queries";
import multipart from '@fastify/multipart';

export const fastify = Fastify({
  logger: true,
});

const start = async function () {
  const secret = crypto.randomBytes(64).toString("hex");
  
  try {
    await fastify.register(fastifyFormbody);
    await fastify.register(fastifyCookie);
	await fastify.register(fastifyMultipart);
	// fastify.register(multipart, {
	//   limits: {
	//     fileSize: 100 * 1024, // 100 KB
	//   }
	// });
	await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '..', 'avatars'),
      prefix: '/avatars/',
    });
    await fastify.register(fastifySession, {
      secret,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
	},
      saveUninitialized: false,
      cookieName: SESSION_COOKIE_NAME,
    });

	fastify.get("/ws-health", (req, reply) => {
		reply.send({ status: "WebSocket server is bound on /ws" });
		});

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("APP IS RUNNING ON PORT 3000");

	// Create necessary tables if not exists
	const db = new UserDb("/app/database/test.db").openDb();
	db.prepare(QueryUser.CREATE_TABLE).run();
	db.prepare(QueryFriend.CREATE_FRIEND_TABLE).run();
	db.close();

	loadBlockedUsersFromDatabase();
	// (fastify as any).websocketClients = new Set();
	setInterval(loadBlockedUsersFromDatabase, 3000);
	startWebSocketServer(fastify.server);
	
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
