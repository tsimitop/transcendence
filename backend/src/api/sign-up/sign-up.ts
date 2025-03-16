import { FastifyRequest } from "fastify";
import { fastify } from "../sign-in";
import Database, { Database as DbType } from "better-sqlite3";
import { QueryUser } from "../../queries";
import SignUpValidation from "./SignUpValidation";

type SignUpDataType = {
  email: string;
  username: string;
  password: string;
};

const openUserDb = function (userDbPath: string) {
  // backend Dockerfile changes the path to /app and runs CMD form /app:
  const userDb = new Database(userDbPath);
  return userDb;
};

const createUserTableInUserDb = function (userDb: DbType) {
  userDb.prepare(QueryUser.CREATE_TABLE).run();
};

const createNewUserInUserDb = function (userDb: DbType, user: SignUpDataType) {
  const newUserStatement = userDb.prepare(QueryUser.INSERT_NEW_USER);
  newUserStatement.run(
    user.email.toLowerCase(),
    user.username.toLowerCase(),
    user.password
  );

  // const userTable = userDb.prepare(QueryUser.SELECT_USER_TABLE).all();
};

const userExistsInUserDb = function (
  userDb: DbType,
  email: string,
  username: string
): { found: boolean; email: string; username: string } {
  // const stmt = userDb.prepare(
  //   "SELECT email, username FROM test_users WHERE email = ? OR username = ?"
  // );
  const findEmailStatement = userDb.prepare(QueryUser.FIND_EMAIL);
  const findUsernameStatement = userDb.prepare(QueryUser.FIND_USERNAME);

  const emailsList = findEmailStatement.all(email.toLowerCase());
  const usernamesList = findUsernameStatement.all(username.toLocaleLowerCase());
  const found = emailsList.length || usernamesList.length;
  return {
    found: !!found,
    email: emailsList.length ? email : "",
    username: usernamesList.length ? username : "",
  };
};

fastify.post(
  "/api/sign-up",
  function (request: FastifyRequest<{ Body: SignUpDataType }>, reply) {
    const { email, username, password } = request.body;
    if (!email?.trim() || !username?.trim() || !password?.trim()) {
      reply.send({ error: "invalid input" });
      return;
    }

    const userDb = openUserDb("database/test.db");
    createUserTableInUserDb(userDb);

    const userAlreadyExists = userExistsInUserDb(userDb, email, username);
    const validation = new SignUpValidation(email, username, password);

    const { validEmail, validPassword } = validation.isFormValid();

    if (!validEmail && !validPassword) {
      reply.send({
        errorMessage: SignUpValidation.errorMessage,
        passwordError: SignUpValidation.passwordError,
        emailError: SignUpValidation.emailError,
      });
      return;
    }

    if (!validPassword) {
      reply.send({
        errorMessage: SignUpValidation.errorMessage,
        passwordError: SignUpValidation.passwordError,
      });
      return;
    }

    if (!validEmail) {
      reply.send({
        errorMessage: SignUpValidation.errorMessage,
        emailError: SignUpValidation.emailError,
      });
      return;
    }

    if (
      userAlreadyExists.found &&
      userAlreadyExists.username &&
      userAlreadyExists.email
    ) {
      reply.send({
        errorMessage: `The username "${username.toLocaleLowerCase()}" and email "${email.toLowerCase()}" already exist`,
      });
      return;
    } else if (userAlreadyExists.found && userAlreadyExists.username) {
      reply.send({
        errorMessage: `The username "${username.toLowerCase()}" already exists`,
      });
      return;
    } else if (userAlreadyExists.found && userAlreadyExists.email) {
      reply.send({
        errorMessage: `The email "${email.toLowerCase()}" already exists`,
      });
      return;
    }

    createNewUserInUserDb(userDb, request.body);
    reply.send(request.body);
  }
);
