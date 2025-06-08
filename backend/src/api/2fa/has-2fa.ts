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
    try {
      const user = request.body.user;

      if (!user || !user.id) {
        return reply.status(400).send({
          error: "Invalid input: user is required"
        });
      }

      const userDbInstance = new UserDb("database/test.db");
      const userDb = userDbInstance.openDb();
      const has2Fa = userDbInstance.get2FaStatus(userDb, user.id);
      userDb.close();

      if (has2Fa === null) {
        return reply.status(404).send({
          error: "User not found"
        });
      }

      reply.send({ has2Fa });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({
        error: "Internal server error"
      });
    }
  }
);
