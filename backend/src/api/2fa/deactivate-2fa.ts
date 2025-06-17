import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

fastify.post("/api/deactivate-2fa", function (request, reply) {
  try {
    const user = request.body as UserStateType;

    if (!user || !user.id) {
      return reply.status(400).send({
        errorMessage: "Invalid input: user is required",
        is2FaDeactivated: false
      });
    }

    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    userDbInstance.updateHas2Fa(userDb, user.id, 0);
    userDbInstance.updateTotpSecret(userDb, user.id, "");
    userDb.close();

    reply.send({ errorMessage: "", is2FaDeactivated: true });
  } catch (error) {
    console.log(error);
    return reply.status(500).send({
      errorMessage: "Internal server error",
      is2FaDeactivated: false
    });
  }
});
