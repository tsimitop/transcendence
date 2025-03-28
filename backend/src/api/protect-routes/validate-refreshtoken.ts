import { FastifyRequest } from "fastify/types/request";
// import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";

type ValidationType = {
  accesstoken: string;
  user: UserStateType;
};

fastify.post(
  "/api/refresh-token",
  (request: FastifyRequest<{ Body: ValidationType }>, reply) => {
    // bcrypt.compare(request.cookies.refreshtoken);

    reply.send({
      test: "test",
      refreshtoken: request.cookies.refreshtoken,
      accesstoken: request.body.accesstoken,
    });
  }
);
