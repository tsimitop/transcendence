import speakeasy from "speakeasy";
import Qrcode from "qrcode";
import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

type activate2FaRequestType = {
  user: UserStateType;
};

fastify.post(
  "/api/activate-2fa",
  async function (
    request: FastifyRequest<{ Body: activate2FaRequestType }>,
    reply
  ) {
    try {
      const user = request.body.user;

      if (!user || !user.id) {
        return reply.status(400).send({
          errorMessage: "Invalid input: user is required",
        });
      }

      const totpSecret = speakeasy.generateSecret({ name: "transcendence" });
      if (!totpSecret.otpauth_url) {
        return reply.status(500).send({
          errorMessage: "Failed to generate 2FA secret",
        });
      }

      const dataUrl = await Qrcode.toDataURL(totpSecret.otpauth_url);
      const userDbInstance = new UserDb("database/test.db");
      const userDb = userDbInstance.openDb();
      userDbInstance.updateTotpSecret(userDb, user.id, totpSecret.base32);
      userDb.close();

      reply.send({ dataUrl });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({
        errorMessage: "Internal server error",
      });
    }
  }
);
