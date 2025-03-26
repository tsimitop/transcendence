import { FastifyRequest } from "fastify";
import Database, { Database as DbType } from "better-sqlite3";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { QueryUser } from "../../queries";
import "./jwt";

type SignInType = {
  usernameOrEmail: string;
  password: string;
};

type UserStateType = {
  email: string;
  username: string;
  isSignedIn: boolean;
};

const openUserDb = function (userDbPath: string) {
  // backend Dockerfile changes the path to /app and runs CMD form /app:
  const userDb = new Database(userDbPath);
  return userDb;
};

const isUserAndPasswordValid = async function (
  userDb: DbType,
  usernameOrEmail: string,
  password: string
): Promise<UserStateType> {
  const findEmailByEmailStatement = userDb.prepare(
    QueryUser.FIND_EMAIL_BY_EMAIL
  );
  const findUsernameByUsernameStatement = userDb.prepare(
    QueryUser.FIND_USERNAME_BY_USERNAME
  );

  const emailsList = findEmailByEmailStatement.all(
    usernameOrEmail.trim().toLowerCase()
  ) as { email: string }[];
  const usernamesList = findUsernameByUsernameStatement.all(
    usernameOrEmail.trim()
  ) as {
    username: string;
  }[];
  const isLoginByEmail = emailsList.length;
  const isLoginByUsername = usernamesList.length;
  const foundUser = isLoginByEmail || isLoginByUsername;
  if (!foundUser) {
    return { email: "", username: "", isSignedIn: false };
  }

  const findPasswordStatement = userDb.prepare(
    isLoginByEmail
      ? QueryUser.FIND_PASSWORD_BY_EMAIL
      : QueryUser.FIND_PASSWORD_BY_USERNAME
  );
  const hashedPasswordList = findPasswordStatement.all(
    isLoginByEmail ? emailsList[0].email : usernameOrEmail
  ) as [{ password: string }];

  const [foundHashedPassword] = hashedPasswordList;
  const isPasswordValid = await bcrypt.compare(
    password,
    foundHashedPassword.password
  );

  const findEmailByUsernameStatement = userDb.prepare(
    QueryUser.FIND_EMAIL_BY_USERNAME
  );
  const findUsernameByEmailStatement = userDb.prepare(
    QueryUser.FIND_USERNAME_BY_EMAIL
  );

  const user: UserStateType = {
    email:
      emailsList[0]?.email ||
      (
        findEmailByUsernameStatement.all(usernamesList[0]?.username) as [
          { email: string }
        ]
      )[0].email,
    username:
      usernamesList[0]?.username ||
      (
        findUsernameByEmailStatement.all(emailsList[0]?.email) as [
          { username: string }
        ]
      )[0].username,
    isSignedIn: isPasswordValid,
  };

  return user;
};

fastify.post(
  "/api/sign-in",
  async function (request: FastifyRequest<{ Body: SignInType }>, reply) {
    const { usernameOrEmail, password } = request.body;

    if (!usernameOrEmail.trim() || !password.trim()) {
      reply.send({
        errorMessage: "Invalid input",
      });
      return;
    }

    const userDb = openUserDb("database/test.db");
    const user = await isUserAndPasswordValid(
      userDb,
      usernameOrEmail,
      password
    );

    if (!user.isSignedIn) {
      reply.send({
        errorMessage: "Invalid username or password!",
      });
      return;
    }
    reply.send(user);
  }
);
