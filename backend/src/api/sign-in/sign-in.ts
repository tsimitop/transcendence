import { FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { signJwtAccessToken, signJwtRefreshToken } from "./jwt";
import UserDb from "../../user-database/UserDb";

type SignInType = {
  usernameOrEmail: string;
  password: string;
};

export type UserStateType = {
  id: string;
  email: string;
  username: string;
  isSignedIn: boolean;
};

fastify.post(
  "/api/sign-in",
  async function (request: FastifyRequest<{ Body: SignInType }>, reply) {
    const { usernameOrEmail, password } = request.body;

    if (!usernameOrEmail.trim() || !password.trim()) {
      reply.send({
        errorMessage: "Invalid input",
        user: null,
        jwtAccessToken: "",
      });
      return;
    }

    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    const user = await userDbInstance.findUserInDb(
      userDb,
      usernameOrEmail,
      password
    );

    if (!user.isSignedIn) {
      reply.send({
        errorMessage: "Invalid username or password!",
        user: null,
        jwtAccessToken: "",
      });
      return;
    }

    const jwtAccessToken = signJwtAccessToken(user.id);
    const jwtRefreshToken = signJwtRefreshToken(user.id);
    try {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedRefreshToken = await bcrypt.hash(jwtRefreshToken, salt);
      await userDbInstance.updateHashedRefreshToken(
        userDb,
        user.id,
        hashedRefreshToken
      );
    } catch (error) {
      console.log(error);
    }

    reply.cookie("refreshtoken", jwtRefreshToken, {
      // domain: "localhost",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      // maxAge: 7 * 24 * 60 * 60 * 1000,
      // maxAge: 10 * 1000,
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      // expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    reply.send({ errorMessage: "", user, jwtAccessToken });
  }
);
