import { FastifyRequest } from "fastify";
import Database, { Database as DbType } from "better-sqlite3";
import bcrypt from "bcrypt";
import { fastify } from "../server";
import { QueryUser } from "../queries";

type SignInDataType = {
  usernameOrEmail: string;
  password: string;
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
): Promise<boolean> {
  const findEmailStatement = userDb.prepare(QueryUser.FIND_EMAIL);
  const findUsernameStatement = userDb.prepare(QueryUser.FIND_USERNAME);

  const emailsList = findEmailStatement.all(
    usernameOrEmail.trim().toLowerCase()
  ) as { email: string }[];
  const usernamesList = findUsernameStatement.all(usernameOrEmail.trim());
  const isLoginByEmail = emailsList.length;
  const isLoginByUsername = usernamesList.length;
  const foundUser = isLoginByEmail || isLoginByUsername;
  console.log(foundUser);
  if (!foundUser) {
    return false;
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

  return isPasswordValid;
};

fastify.post(
  "/api/sign-in",
  async function (request: FastifyRequest<{ Body: SignInDataType }>, reply) {
    const { usernameOrEmail, password } = request.body;

    if (!usernameOrEmail.trim() || !password.trim()) {
      reply.send({
        errorMessage: "Invalid input",
      });
      return;
    }

    const userDb = openUserDb("database/test.db");
    const validUserAndPassword = await isUserAndPasswordValid(
      userDb,
      usernameOrEmail,
      password
    );

    if (!validUserAndPassword) {
      reply.send({
        errorMessage: "Invalid username or password!",
      });
      console.log("asdsadasdasdads");
      return;
    }

    reply.send({ message: "You are logged in successfully" });
  }
);
