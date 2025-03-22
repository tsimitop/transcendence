import Fastify from "fastify";
import { error } from "console";

export const fastify = Fastify({
  logger: true,
});

// fastify.listen({ port: 3000, host: "0.0.0.0" }, function (err, address) {
fastify.listen({ port: 3000, host: "0.0.0.0" }, function (err) {
  if (err) {
    fastify.log.error(error);
    process.exit(1);
  }
});
