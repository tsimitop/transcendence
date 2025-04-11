import { fastify } from "../../server";

fastify.get("/api/oauth", function (req, reply) {
  reply.send({ test: "hi" });
});
