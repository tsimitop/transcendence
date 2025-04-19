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
    const user = request.body.user;
    const totpSecret = speakeasy.generateSecret({ name: "transcendence" });
    if (!totpSecret.otpauth_url) {
      reply.send({
        errorMessage: "Something went wrong!",
      });
      return;
    }

    try {
      const dataUrl = await Qrcode.toDataURL(totpSecret.otpauth_url);
      const userDbInstance = new UserDb("database/test.db");
      const userDb = userDbInstance.openDb();
      userDbInstance.updateTotpSecret(userDb, user.id, totpSecret.base32);
      reply.send({ dataUrl });
      return;
    } catch (error) {
      console.log(error);
      reply.send({
        errorMessage: "Something went wrong!",
      });
      return;
    }
  }
);
