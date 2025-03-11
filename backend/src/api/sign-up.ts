import { FastifyRequest } from "fastify";
import { fastify } from "./sign-in";

type BodyType = {
  email: string;
  username: string;
  password: string;
};

fastify.post(
  "/api/sign-up",
  function (request: FastifyRequest<{ Body: BodyType }>, reply) {
    const { email, username, password } = request.body;
    if (!email?.trim() || !username?.trim() || !password?.trim()) {
      reply.send({ error: "invalid input" });
      return;
    }
    reply.send(request.body);
  }
);
