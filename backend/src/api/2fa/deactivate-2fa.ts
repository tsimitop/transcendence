import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

fastify.post("/api/deactivate-2fa", function (request, reply) {
  const user = request.body as UserStateType;
  const userDbInstance = new UserDb("database/test.db");
  const userDb = userDbInstance.openDb();
  userDbInstance.updateHas2Fa(userDb, user.id, 0);
  userDbInstance.updateTotpSecret(userDb, user.id, "");
  reply.send({ errorMessage: "", is2FaDeactivated: true });
});
