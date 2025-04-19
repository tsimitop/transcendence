import speakeasy from "speakeasy";
import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

type Validate2FaRequestType = {
  user: UserStateType;
  code2Fa: string;
};

fastify.post(
  "/api/validate-2fa",
  async function (
    request: FastifyRequest<{ Body: Validate2FaRequestType }>,
    reply
  ) {
    const { user, code2Fa } = request.body;
    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    const totpSecret = userDbInstance.getTotpSecret(userDb, user.id);
    const is2FaCodeValid = speakeasy.totp.verify({
      secret: totpSecret,
      encoding: "base32",
      token: code2Fa,
    });
		if (is2FaCodeValid) {
			reply.send({ errorMessage: "", isSignedIn: true });
		} else {
			reply.send({ errorMessage: "Please enter the valid 6-digit code", isSignedIn: false });
		}
  }
);
