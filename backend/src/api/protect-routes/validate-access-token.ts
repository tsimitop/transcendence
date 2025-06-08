import dotenv from "dotenv";
import { FastifyRequest } from "fastify/types/request";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { UserStateType } from "../sign-in/sign-in";
import UserDb from "../../user-database/UserDb";

dotenv.config({ path: "./env" });

const validateAccessToken = function (accessToken: string) {
  try {
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as jwt.Secret;
    const decoded = jwt.verify(accessToken, accessTokenSecret);
    return decoded;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const checkAccessTokenInCookies = function (
  accessTokenInCookies: string = ""
): string {
  if (!accessTokenInCookies) {
    return "";
  }
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as Secret;
  try {
    jwt.verify(accessTokenInCookies, accessTokenSecret);
    return accessTokenInCookies;
  } catch (error) {
    console.log(error);
    return "";
  }
};

fastify.post(
  "/api/validate-access-token",
  async (request: FastifyRequest<{ Body: { user: UserStateType } }>, reply) => {
    try {
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
          isSignedIn: false,
          userId: "",
          email: "",
          username: "",
          avatar: "",
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
          isSignedIn: false,
          userId: "",
          email: "",
          username: "",
          avatar: "",
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
          isSignedIn: false,
          userId: "",
          email: "",
          username: "",
          avatar: "",
        });
        return;
      }
      // console.log(hashedRefreshToken);
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
          isSignedIn: false,
          userId: "",
          email: "",
          username: "",
          avatar: "",
        });
        return;
      }

      const accessTokenInHeader =
        request.headers.authorization?.split(" ")[1] || null;
      // console.log(
      //   "----------------accessTokenInHeader--------------:",
      //   accessTokenInHeader
      // );

      let accessTokenInCookies = "";

      if (!accessTokenInHeader) {
        accessTokenInCookies = checkAccessTokenInCookies(
          request.cookies.accesstoken
        );
      }

      if (!accessTokenInHeader && !accessTokenInCookies) {
        reply.send({
          errorMessage:
            "No access token in Authorization header! Refresh token will be used to generate a new access token",
          isRefreshTokenValid: true,
          isAccessTokenValid: false,
          isNewAccessTokenNeeded: true,
          isSignedIn: false,
          userId: "",
          email: "",
          username: "",
          avatar: "",
        });
        return;
      }

      const userId = userDbInstance.findUserIdByHashedRefreshToken(
        userDb,
        hashedRefreshToken
      );
      const email = userDbInstance.findEmailByHashedRefreshToken(
        userDb,
        hashedRefreshToken
      );
      const username = userDbInstance.findUsernameByHashedRefreshToken(
        userDb,
        hashedRefreshToken
      );
	  const avatar = userDbInstance.findAvatarByHashedRefreshToken(
        userDb,
        hashedRefreshToken
      );

      if (accessTokenInHeader) {
        validateAccessToken(accessTokenInHeader);
      } else {
        validateAccessToken(accessTokenInCookies);
      }
      reply.send({
        errorMessage: "",
        isRefreshTokenValid: true,
        isAccessTokenValid: true,
        isNewAccessTokenNeeded: false,
        isSignedIn: true,
        userId,
        email,
        username,
        avatar,
      });
      return;
    } catch (error) {
      console.log(error);
      reply.send({
        errorMessage:
          error ||
          "Access token is invalid. Refresh token will be used to generate a new access token",
        isRefreshTokenValid: true,
        isAccessTokenValid: false,
        isNewAccessTokenNeeded: true,
        isSignedIn: false,
        userId: "",
        email: "",
        username: "",
        avatar: "",
      });
    }
  }
);
