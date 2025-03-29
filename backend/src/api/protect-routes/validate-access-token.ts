import dotenv from "dotenv";
import { FastifyRequest } from "fastify/types/request";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

dotenv.config({ path: "./env" });

type ValidationType = {
  user: string;
};

const validateAccessToken = async function (accessTokenInHeader: string) {
  const accessTokenSecret = process.env.ACCESS_TOKEN as jwt.Secret;
  const decoded = jwt.verify(accessTokenInHeader, accessTokenSecret);
  return decoded;
};

fastify.post(
  "/api/validate-access-token",
  async (request: FastifyRequest<{ Body: ValidationType }>, reply) => {
    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    if (!request.body || request.body.user) {
      reply.send({
        errorMessage: "User is not signed in!",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
      });
      return;
    }
    const { user: userString } = request.body;
    const user = JSON.parse(userString) as UserStateType;

    const refreshTokensList = userDbInstance.findRefreshToken(userDb, user);

    if (!refreshTokensList.length) {
      reply.send({
        errorMessage:
          "No hashed refresh token found in database! Redirecting to the homepage",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
      });
      return;
    }
    const hashedRefreshToken = refreshTokensList[0].jwt_refresh_token;
    const refreshTokenInCookie = request.cookies.refreshtoken;
    if (!request.cookies || !refreshTokenInCookie) {
      reply.send({
        errorMessage: "No cookies or no refresh token!",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
      });
      return;
    }

    const doesRefreshTokenMatch = await bcrypt.compare(
      refreshTokenInCookie,
      hashedRefreshToken
    );

    if (!doesRefreshTokenMatch) {
      reply.send({
        errorMessage:
          "Refresh token does not match the hashed refresh token! Redirecting to the homepage",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
      });
      return;
    }

    const accessTokenInHeader =
      request.headers.authorization?.split(" ")[1] || null;

    if (!accessTokenInHeader) {
      reply.send({
        errorMessage:
          "No access token in Authorization header! Redirecting to the homepage",
        isRefreshTokenValid: true,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
      });
      return;
    }

    try {
      const encoded = await validateAccessToken(accessTokenInHeader);
      reply.send({
        errorMessage: "",
        isRefreshTokenValid: true,
        isAccessTokenValid: true,
        isNewAccessTokenNeeded: false,
        encoded: encoded,
      });
      return;
    } catch (error) {
      console.log(error);
      reply.send({
        errorMessage:
          "Access token is invalid. Refresh token will be used to generate a new access token",
        isRefreshTokenValid: true,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: true,
        encoded: null,
      });
    }
  }
);
