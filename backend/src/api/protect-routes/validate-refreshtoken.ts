import { FastifyRequest } from "fastify/types/request";
import { fastify } from "../../server";

type ValidationType = {
  accesstoken: string;
};

fastify.post(
  "/api/refresh-token",
  (request: FastifyRequest<{ Body: ValidationType }>, reply) => {
    reply.send({
      test: "test",
      refreshtoken: request.cookies.refreshtoken,
      accesstoken: request.body.accesstoken,
    });
  }
);
