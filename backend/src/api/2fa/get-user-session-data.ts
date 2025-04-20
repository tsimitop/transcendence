import { fastify } from "../../server";

fastify.get("/api/get-user-session-data", function (request, reply) {
  reply.send(request.session.user || null);
});
