import { FastifyRequest } from "fastify/types/request";
import { fastify } from "../../server";

type OAuthRequestType = {
  state: string;
  error?: string;
  code: string;
  scope: string;
  prompt: string;
};

fastify.get(
  "/api/oauth",
  function (req: FastifyRequest<{ Querystring: OAuthRequestType }>, reply) {
    const { state, code, scope, prompt, error } = req.query;
    const oAuthStateInCookie = req.cookies?.["oauth_state"];
    if (error || oAuthStateInCookie !== state) {
      reply.redirect("http://localhost:5173/");
    }

    reply.redirect("http://localhost:5173/profile");
  }
);
