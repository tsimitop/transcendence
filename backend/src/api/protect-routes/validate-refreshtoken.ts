import { FastifyRequest } from "fastify/types/request";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import { QueryUser } from "../../queries";

type ValidationType = {
  accesstoken: string;
  user: string;
};

const openUserDb = function (userDbPath: string) {
  const userDb = new Database(userDbPath);
  return userDb;
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
        errorMessage: "No hashed refresh token found in database!",
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
        errorMessage: "Refresh token does not match the hashed refresh token!",
      });
      return;
    }
    reply.send({
      cookieRefreshToken: refreshTokenInCookie,
      hashedRefreshToken: hashedRefreshToken,
      doesRefreshTokenMatch,
    });
  }
);
