import { fastify } from "./api/sign-in";

fastify.post("/api", function (request, reply) {
  console.log("-----------------------------------");
  console.log(request.body);
  console.log("-----------------------------------");
  reply.send(request.body);
});
