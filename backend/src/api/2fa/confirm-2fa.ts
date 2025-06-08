import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

type Confirm2FaRequestType = {
  user: UserStateType;
};

fastify.post(
  "/api/confirm-2fa",
  async function (
    request: FastifyRequest<{ Body: Confirm2FaRequestType }>,
    reply
  ) {
    try {
      const user = request.body.user;

      if (!user || !user.id) {
        return reply.status(400).send({
          error: "Invalid input: user is required"
        });
      }

      const userDbInstance = new UserDb("database/test.db");
      const userDb = userDbInstance.openDb();
      userDbInstance.updateHas2Fa(userDb, user.id, 1);
      userDb.close();

      reply.send({ test: request.body });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({
        error: "Internal server error"
      });
    }
  }
);
