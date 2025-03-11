import { error } from "console";
import Fastify from "fastify";

export const fastify = Fastify({
  logger: true,
});

fastify.post("/api/sign-in", function (request, reply) {
  console.log("***************************");
  console.log(request.body);
  console.log("***************************");
  reply.send(request.body);
});

fastify.listen({ port: 3000, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(error);
    process.exit(1);
  }
});
