import speakeasy from "speakeasy";
import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { sendRefreshAndAccessTokens, UserStateType } from "../sign-in/sign-in";
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
    try {
      const { user, code2Fa } = request.body;

      console.log("2FA validation request:", {
        user: user ? { id: user.id, username: user.username, email: user.email } : null,
        code2Fa: code2Fa
      });

      if (!user || !user.id || !code2Fa) {
        console.log("2FA validation failed - missing data:", {
          hasUser: !!user,
          hasUserId: !!(user && user.id),
          hasCode2Fa: !!code2Fa
        });
        return reply.status(400).send({
          errorMessage: "Invalid input: user and 2FA code are required",
          isSignedIn: false,
        });
      }

      const userDbInstance = new UserDb("database/test.db");
      const userDb = userDbInstance.openDb();
      const totpSecret = userDbInstance.getTotpSecret(userDb, user.id);

      if (!totpSecret) {
        userDb.close();
        return reply.status(404).send({
          errorMessage: "User not found or 2FA not configured",
          isSignedIn: false,
        });
      }

      const is2FaCodeValid = speakeasy.totp.verify({
        secret: totpSecret,
        encoding: "base32",
        token: code2Fa,
      });

      if (is2FaCodeValid) {
        await sendRefreshAndAccessTokens(user, userDbInstance, userDb, reply);
      } else {
        userDb.close();
        reply.send({
          errorMessage: "Please enter the valid 6-digit code",
          isSignedIn: false,
        });
      }
    } catch (error) {
      console.log(error);
      return reply.status(500).send({
        errorMessage: "Internal server error",
        isSignedIn: false,
      });
    }
  }
);
