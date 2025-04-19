import speakeasy from "speakeasy";
import Qrcode from "qrcode";
import { fastify } from "../../server";
import { FastifyRequest } from "fastify";
import { UserStateType } from "../sign-in/sign-in";

type activate2FaRequestType = {
  user: UserStateType;
};

fastify.post(
  "/api/activate-2fa",
  async function (
    request: FastifyRequest<{ Body: activate2FaRequestType }>,
    reply
  ) {
    const secret2Fa = speakeasy.generateSecret({ name: "transcendence" });
    if (!secret2Fa.otpauth_url) {
      reply.send({
        errorMessage: "Something went wrong!",
      });
      return;
    }

    const dataUrl = await Qrcode.toDataURL(secret2Fa.otpauth_url);
    reply.send({ dataUrl });
  }
);
