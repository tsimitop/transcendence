import dotenv from "dotenv";
import { FastifyRequest } from "fastify/types/request";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import { QueryUser } from "../../queries";

dotenv.config({ path: "./env" });

type ValidationType = {
  user: string;
};

const openUserDb = function (userDbPath: string) {
  const userDb = new Database(userDbPath);
  return userDb;
};

const validateAccessToken = async function (accessTokenInHeader: string) {
  const accessTokenSecret = process.env.ACCESS_TOKEN as jwt.Secret;
  const decoded = jwt.verify(accessTokenInHeader, accessTokenSecret);
  return decoded;
};

fastify.post(
  "/api/refresh-token",
  async (request: FastifyRequest<{ Body: ValidationType }>, reply) => {
    const userDb = openUserDb("database/test.db");
    const { user: userString } = request.body;
    const user = JSON.parse(userString) as UserStateType;
    const findRefreshTokenStatement = userDb.prepare(
      QueryUser.FIND_JWT_REFRESH_TOKEN_BY_ID
    );
    const refreshTokensList = findRefreshTokenStatement.all(user.id) as [
      { jwt_refresh_token: string }
    ];

    if (!refreshTokensList.length) {
      reply.send({
        errorMessage:
          "No hashed refresh token found in database! Redirecting to the homepage",
      });
      return;
    }
    const hashedRefreshToken = refreshTokensList[0].jwt_refresh_token;
    if (!request.cookies || !request.cookies.refreshtoken) {
      reply.send({ errorMessage: "No cookies or no refresh token!" });
      return;
    }
    const refreshTokenInCookie = request.cookies.refreshtoken;

    const doesRefreshTokenMatch = await bcrypt.compare(
      request.cookies.refreshtoken,
      hashedRefreshToken
    );

    if (!doesRefreshTokenMatch) {
      reply.send({
        errorMessage:
          "Refresh token does not match the hashed refresh token! Redirecting to the homepage",
      });
      return;
    }

    const accessTokenInHeader =
      request.headers.authorization?.split(" ")[1] || null;

    if (!accessTokenInHeader) {
      reply.send({
        errorMessage:
          "No access token in Authorization header! Redirecting to the homepage",
      });
      return;
    }

    try {
      const encoded = await validateAccessToken(accessTokenInHeader);
      reply.send({ encoded: encoded });
      return;
    } catch (error) {
      console.log(error);
      reply.send({
        errorMessage:
          "Access token is invalid. Refresh token will be used to generate a new access token",
      });
    }

    reply.send({
      cookieRefreshToken: refreshTokenInCookie,
      hashedRefreshToken: hashedRefreshToken,
      doesRefreshTokenMatch,
      accessTokenInHeader,
    });
  }
);
