// import { FastifyRequest } from "fastify";
import { fastify } from "../../server";

fastify.post("/api/sign-out", async function (request, reply) {
  reply.send({ message: "signing out" });
});
