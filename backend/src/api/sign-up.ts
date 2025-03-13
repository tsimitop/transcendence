import { FastifyRequest } from "fastify";
import { fastify } from "./sign-in";
import Database from "better-sqlite3";

type SignUpDataType = {
  email: string;
  username: string;
  password: string;
};

const createNewUser = function (user: SignUpDataType) {
  console.log("----------------- new user: -----------------");
  console.log(Database);
  console.log(user);
  console.log("---------------------------------------------");
};

fastify.post(
  "/api/sign-up",
  function (request: FastifyRequest<{ Body: SignUpDataType }>, reply) {
    const { email, username, password } = request.body;
    if (!email?.trim() || !username?.trim() || !password?.trim()) {
      reply.send({ error: "invalid input" });
      return;
    }

    createNewUser(request.body);
    reply.send(request.body);
  }
);
