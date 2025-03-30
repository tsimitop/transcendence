import dotenv from "dotenv";
import { FastifyRequest } from "fastify/types/request";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

dotenv.config({ path: "./env" });

const validateAccessToken = function (accessTokenInHeader: string) {
  const accessTokenSecret = process.env.ACCESS_TOKEN as jwt.Secret;
  const decoded = jwt.verify(accessTokenInHeader, accessTokenSecret);
  return decoded;
};

fastify.post(
  "/api/validate-access-token",
  async (request: FastifyRequest<{ Body: { user: UserStateType } }>, reply) => {
    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    const cookieRefreshToken = request.cookies.refreshtoken;
    // if (!request.body || !request.body?.user || !request.body?.user?.id) {
    if (!cookieRefreshToken) {
      reply.send({
        errorMessage: "User is not signed in!",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
        refreshtoken: cookieRefreshToken,
      });
      return;
    }
    // const { user } = request.body;
    const hashedRefreshToken =
      await userDbInstance.findHashedRefreshTokenByCookieRefreshToken(
        userDb,
        cookieRefreshToken
      );
    // const refreshTokensList = userDbInstance.findRefreshTokenByUserId(
    //   userDb,
    //   user
    // );

    if (!hashedRefreshToken) {
      reply.send({
        errorMessage:
          "No hashed refresh token found in database! Redirecting to the homepage",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
        refreshtoken: cookieRefreshToken,
      });
      return;
    }
    const refreshTokenInCookie = cookieRefreshToken;
    if (!request.cookies || !refreshTokenInCookie) {
      reply.send({
        errorMessage: "No cookies or no refresh token!",
        isRefreshTokenValid: false,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: false,
        encoded: null,
        refreshtoken: cookieRefreshToken,
        hashedRefreshToken,
      });
      return;
    }
    console.log(hashedRefreshToken);
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
        refreshtoken: cookieRefreshToken,
        hashedRefreshToken,
      });
      return;
    }

    const accessTokenInHeader =
      request.headers.authorization?.split(" ")[1] || null;
    console.log(
      "----------------accessTokenInHeader--------------:",
      accessTokenInHeader
    );

    if (!accessTokenInHeader) {
      reply.send({
        errorMessage:
          "No access token in Authorization header! Refresh token will be used to generate a new access token",
        isRefreshTokenValid: true,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: true,
        encoded: null,
        refreshtoken: cookieRefreshToken,
        hashedRefreshToken,
      });
      return;
    }

    try {
      const encoded = validateAccessToken(accessTokenInHeader);
      reply.send({
        errorMessage: "",
        isRefreshTokenValid: true,
        isAccessTokenValid: true,
        isNewAccessTokenNeeded: false,
        encoded: encoded,
        refreshtoken: cookieRefreshToken,
        hashedRefreshToken,
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
        refreshtoken: cookieRefreshToken,
        hashedRefreshToken,
      });
    }
  }
);
