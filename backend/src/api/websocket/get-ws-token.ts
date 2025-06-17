import { fastify } from "../../server";

fastify.get("/api/ws-token", async function (request, reply) {
  const accessToken = request.cookies.accesstoken;
  
  if (!accessToken) {
    reply.send({
      errorMessage: "No access token found",
      token: "",
    });
    return;
  }
  
  reply.send({
    errorMessage: "",
    token: accessToken,
  });
});