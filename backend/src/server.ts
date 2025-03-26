import Fastify from "fastify";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";

export const fastify = Fastify({
  logger: true,
});

const start = async function () {
  try {
    await fastify.register(fastifyFormbody);
    await fastify.register(fastifyCookie);
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("APP IS RUNNING ON PORT 3000");
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
