// import speakeasy from "speakeasy";
import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

type confirm2FaRequestType = {
  user: UserStateType;
};

fastify.post(
  "/api/confirm-2fa",
  async function (
    request: FastifyRequest<{ Body: confirm2FaRequestType }>,
    reply
  ) {
    const user = request.body.user;
    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    userDbInstance.updateHas2Fa(userDb, user.id, 1);
    reply.send({ test: request.body });
  }
);
