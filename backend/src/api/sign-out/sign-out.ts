// import { FastifyRequest } from "fastify";
import { fastify } from "../../server";

fastify.post("/api/sign-out", async function (request, reply) {
  reply.clearCookie("refreshtoken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/api",
  });
  reply.clearCookie("oauthrefreshtoken", {
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
  reply.send({ errorMessage: "", message: "Signed out successfully" });
});
