import dotenv from "dotenv";
import { URLSearchParams } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { FastifyRequest } from "fastify/types/request";
import { fastify } from "../../server";
import UserDb from "../../user-database/UserDb";
import { signJwtAccessToken, signJwtRefreshToken } from "../jwt";
import { FRONT_END_URL } from "../../constants";
import { hasUserActive2Fa, UserStateType } from "../sign-in/sign-in";

declare module "@fastify/session" {
  interface FastifySessionObject {
    user?: UserStateType;
  }
}

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
      reply.redirect(`${FRONT_END_URL}/`);
      return;
    }

    const clientId =
      "670502424156-2ovamqt7kp3opso8mfgm6mua81rq8vas.apps.googleusercontent.com";
    const redirectUri = "https://localhost:4443/api/oauth";

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
      const {
        // access_token: accessToken,
        // refresh_token: refreshToken,
        id_token: idToken,
      } = data;

      const decoded = jwt.decode(idToken) as DecodedIdTokenType;
      const { email, sub } = decoded;

      const userDbInstance = new UserDb("database/test.db");
      const userDb = userDbInstance.openDb();
      userDbInstance.createUserTableInUserDb(userDb);
      const userAlreadyExists = userDbInstance.userExistsInUserDb(
        userDb,
        sub,
        email
      );
      if (!userAlreadyExists.found) {
        console.log("NOT FOUND . . . .. . .");
        await userDbInstance.createNewUserInUserDb(
          userDb,
          {
            email: sub,
            username: email,
            password: "",
          },
          ""
        );
      }
      const user = await userDbInstance.findUserInDb(userDb, email, "");
      if (!user) {
        reply.redirect(`${FRONT_END_URL}/`);
        return;
      }
      user.isSignedIn = true;

      const jwtRefreshToken = signJwtRefreshToken(user.id);
      const jwtAccessToken = signJwtAccessToken(user.id);

      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedRefreshToken = await bcrypt.hash(jwtRefreshToken, salt);
      await userDbInstance.updateHashedRefreshToken(
        userDb,
        user.id,
        hashedRefreshToken
      );

      await userDbInstance.updateHashedRefreshToken(
        userDb,
        user.id,
        hashedRefreshToken
      );

      const has2Fa = await hasUserActive2Fa(user);

      if (!has2Fa) {
        reply.cookie("oauthrefreshtoken", jwtRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });
        reply.cookie("accesstoken", jwtAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          expires: new Date(Date.now() + 15 * 60 * 1000),
        });
        reply.redirect(`${FRONT_END_URL}/profile`);
      } else {
        req.session.user = user;
        console.log("user - - - - - -- - --", user);
        reply.redirect(`${FRONT_END_URL}/2fa`);
      }
    } catch (error) {
      console.log(error);
    }
  }
);
