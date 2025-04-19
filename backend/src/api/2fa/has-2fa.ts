import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

type Has2FaRequestType = {
  user: UserStateType;
};

fastify.post(
  "/api/has-2fa",
  async function (request: FastifyRequest<{ Body: Has2FaRequestType }>, reply) {
    const user = request.body.user;
    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    const has2Fa = userDbInstance.get2FaStatus(userDb, user.id);
    reply.send({ has2Fa });
  }
);
