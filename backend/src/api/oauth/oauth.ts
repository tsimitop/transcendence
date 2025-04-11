import dotenv from "dotenv";
import { URLSearchParams } from "url";
import jwt from "jsonwebtoken";
import { FastifyRequest } from "fastify/types/request";
import { fastify } from "../../server";

type OAuthRequestType = {
  state: string;
  error?: string;
  code: string;
  scope: string;
  prompt: string;
};

type OAuthResponseType = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  id_token: string;
};

type DecodedIdTokenType = {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  iat: number;
  exp: number;
};

dotenv.config({ path: "./.env" });

fastify.get(
  "/api/oauth",
  async function (
    req: FastifyRequest<{ Querystring: OAuthRequestType }>,
    reply
  ) {
    const { state, code, error } = req.query;
    const oAuthStateInCookie = req.cookies?.["oauth_state"];
    if (error || oAuthStateInCookie !== state) {
      reply.redirect("http://localhost:5173/");
    }

    const clientId =
      "670502424156-2ovamqt7kp3opso8mfgm6mua81rq8vas.apps.googleusercontent.com";
    const redirectUri = "http://localhost:3000/api/oauth";

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: process.env.OAUTH_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const data = (await response.json()) as OAuthResponseType;
      const { access_token, refresh_token, id_token } = data;

      const decoded = jwt.decode(id_token) as DecodedIdTokenType;

      console.log("------- data:", data);
      console.log("------- decoded:", decoded);
    } catch (error) {
      console.log(error);
    }

    reply.redirect("http://localhost:5173/profile");
  }
);
