import { fastify } from "../server";

fastify.post("/api/sign-in", function (request, reply) {
  console.log("***************************");
  console.log(request.body);
  console.log("***************************");
  reply.send(request.body);
});
