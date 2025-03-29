import { FastifyRequest } from "fastify";
import { fastify } from "../../server";
import { signJwtAccessToken } from "../sign-in/jwt";
import { UserStateType } from "../sign-in/sign-in";

type RequestNewAccessTokenType = {
  user: string;
};

fastify.post(
  "/api/generate-new-access-token",
  (request: FastifyRequest<{ Body: RequestNewAccessTokenType }>, reply) => {
    const { user: userString } = request.body;
    const user = JSON.parse(userString) as UserStateType;
    const newJwtAccessToken = signJwtAccessToken(user.id);
    reply.send({ user, newJwtAccessToken });
  }
);
