// import { FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { fastify } from "../../server";
import UserDb from "../../user-database/UserDb";
import { signJwtAccessToken } from "../jwt";
import { Secret, verify } from "jsonwebtoken";
// import { UserStateType } from "../sign-in/sign-in";

// type RequestNewAccessTokenType = {
//   user: string;
// };

dotenv.config({ path: "./.env" });

fastify.post(
  "/api/generate-new-access-token",
  // (request: FastifyRequest<{ Body: RequestNewAccessTokenType }>, reply) => {
  async (request, reply) => {
    const cookieRefreshToken = request.cookies.refreshtoken;
    if (!cookieRefreshToken) {
      reply.send({
        errorMessage:
          "No cookie refresh token. User is not signed in. Redirecting to homepage ...",
        userId: "",
        email: "",
        username: "",
        isSignedIn: false,
		avatar: "",
      });

      return;
    }

    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    const hashedRefreshToken =
      await userDbInstance.findHashedRefreshTokenByCookieRefreshToken(
        userDb,
        cookieRefreshToken
      );
    if (!hashedRefreshToken) {
      reply.send({
        errorMessage:
          "No hashed refresh token. User is not signed in. Redirecting to homepage ...",
        userId: "",
        email: "",
        username: "",
        isSignedIn: false,
		avatar: "",
      });
      return;
    }

    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as Secret;

    try {
      verify(cookieRefreshToken, refreshTokenSecret);
    } catch (error) {
      console.log(error);
      reply.send({
        errorMessage:
          "Refresh token is expired. User must sign in again. Redirecting to homepage ...",
        userId: "",
        email: "",
        username: "",
        isSignedIn: false,
		avatar: "",
      });
	  return;
    }


    const doesRefreshTokenMatch = await bcrypt.compare(
      cookieRefreshToken,
      hashedRefreshToken
    );

    if (!doesRefreshTokenMatch) {
      reply.send({
        errorMessage:
          "Hashed refresh token and cookie refresh token do not match. User is not signed in. Redirecting to homepage ...",
        userId: "",
        email: "",
        username: "",
        isSignedIn: false,
		avatar: "",
      });
      return;
    }

    const userId = userDbInstance.findUserIdByHashedRefreshToken(
      userDb,
      hashedRefreshToken
    );
    if (!userId) {
      reply.send({
        errorMessage:
          "Hashed refresh token / cookie refresh token does not belong to any user!!! Redirecting to homepage ...",
        userId: "",
        email: "",
        username: "",
        isSignedIn: false,
		avatar: "",
      });
      return;
    }
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
    const newJwtAccessToken = signJwtAccessToken(userId);
    // console.log("*******************", newJwtAccessToken);
    reply.cookie("accesstoken", newJwtAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });
    reply.send({
      errorMessage: "",
      userId,
      email,
      username,
      isSignedIn: true,
	  avatar,
    });
  }
);
