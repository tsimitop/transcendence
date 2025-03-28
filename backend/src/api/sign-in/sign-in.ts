import { FastifyRequest } from "fastify";
import Database, { Database as DbType } from "better-sqlite3";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { QueryUser } from "../../queries";
import "./jwt";
import { signJwtAccessToken, signJwtRefreshToken } from "./jwt";

type SignInType = {
  usernameOrEmail: string;
  password: string;
};

type UserStateType = {
  id: string;
  email: string;
  username: string;
  isSignedIn: boolean;
};

const openUserDb = function (userDbPath: string) {
  // backend Dockerfile changes the path to /app and runs CMD form /app:
  const userDb = new Database(userDbPath);
  return userDb;
};

const findUserInDb = async function (
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
    return { email: "", username: "", isSignedIn: false, id: "" };
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

  const findIdByUsernameStatement = userDb.prepare(
    QueryUser.FIND_ID_BY_USERNAME
  );
  const findIdByEmailStatement = userDb.prepare(QueryUser.FIND_ID_BY_EMAIL);

  const user: UserStateType = {
    id: isLoginByEmail
      ? (
          findIdByEmailStatement.all(emailsList[0]?.email) as [{ id: string }]
        )[0].id
      : (
          findIdByUsernameStatement.all(usernamesList[0]?.username) as [
            { id: string }
          ]
        )[0].id,
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
        user: null,
        jwtAccessToken: "",
        jwtRefreshToken: "",
      });
      return;
    }

    const userDb = openUserDb("database/test.db");
    const user = await findUserInDb(userDb, usernameOrEmail, password);

    if (!user.isSignedIn) {
      reply.send({
        errorMessage: "Invalid username or password!",
        user: null,
        jwtAccessToken: "",
        jwtRefreshToken: "",
      });
      return;
    }
    const jwtAccessToken = signJwtAccessToken(user.id);
    const jwtRefreshToken = signJwtRefreshToken(user.id);
    const updateUserJwtStatement = userDb.prepare(
      QueryUser.UPDATE_JWT_REFRESH_TOKEN
    );
    updateUserJwtStatement.run(jwtRefreshToken, user.id);

    reply.send({ errorMessage: "", user, jwtAccessToken, jwtRefreshToken });
  }
);
