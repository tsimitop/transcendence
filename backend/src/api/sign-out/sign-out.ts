import { FastifyRequest } from "fastify";
import { SESSION_COOKIE_NAME } from "../../constants";
import { fastify } from "../../server";
import { unregisterUser, broadcastOnlineStatus } from "../../websocket/WebSocket";
import { UserStateType } from "../sign-in/sign-in";

fastify.post("/api/sign-out", async function (request: FastifyRequest<{Body: { user: UserStateType };}>, reply) {
  const username = request.body.user.username;
  reply.clearCookie("refreshtoken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/api",
  });
  reply.clearCookie("accesstoken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/api",
  });
  reply.clearCookie("oauth_state", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    path: "/api",
  });
  reply.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  if (username) {
	unregisterUser(username);
	broadcastOnlineStatus(username, false);
  }

  request.session.user = undefined;
  request.session.destroy();
  reply.send({ errorMessage: "", message: "Signed out successfully" });
});
