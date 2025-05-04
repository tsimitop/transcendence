import { fastify } from "../../server";

fastify.get("/api/generate-state", function (_request, reply) {
  const state = crypto.randomUUID();
  const redirectUri = "https://localhost:4443/api/oauth";
  const clientId =
    "670502424156-2ovamqt7kp3opso8mfgm6mua81rq8vas.apps.googleusercontent.com";
  const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const url = `${baseUrl}?response_type=code&client_id=${clientId}&scope=openid%20email&redirect_uri=${redirectUri}&state=${state}&access_type=offline&prompt=consent`;

  reply.cookie("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 5 * 60 * 1000,
  });
  reply.status(201).send({ url });
});
