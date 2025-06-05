import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import crypto from "crypto";
import fs from "fs";
import { startWebSocketServer } from "./websocket/WebSocket";
import { SESSION_COOKIE_NAME } from "./constants";
import usersRoutes from "./api/users/users";
import friendsRoutes from "./api/friends/friends";
import editingRoutes from "./api/editing/editing";

export const fastify = Fastify({
  logger: true,
});

const start = async function () {
  const secret = crypto.randomBytes(64).toString("hex");
  
  try {
    await fastify.register(fastifyFormbody);
    await fastify.register(fastifyCookie);
	await fastify.register(fastifyMultipart);
	await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '..', 'avatars'),
      prefix: '/avatars/',
    });
    await fastify.register(usersRoutes);
	await fastify.register(friendsRoutes);
	await fastify.register(editingRoutes);
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

	startWebSocketServer(fastify.server);
	
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
