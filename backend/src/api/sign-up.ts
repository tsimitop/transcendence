import { FastifyRequest } from "fastify";
import { fastify } from "./sign-in";
import Database, { Database as DbType } from "better-sqlite3";
import { QueryUser } from "../queries";

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

const isPasswordValid = function (password: string) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;
  return passwordRegex.test(password);
};

const isEmailValid = function (email: string) {
  const emailRegex =
    /^(?!\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
  return emailRegex.test(email);
};

const isFormValid = function (email: string, password: string) {
  const validEmail = isEmailValid(email);
  const validPassword = isPasswordValid(password);

  return { validEmail, validPassword };
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

    const { validEmail, validPassword } = isFormValid(email, password);

    if (!validEmail && !validPassword) {
      reply.send({
        error: "invalid input",
        passwordError:
          "Password must be between 8 and 30 characters, and include at least 1 lowercase and one uppercase letters, and 1 special character @$!%*?&",
        emailError: "Email address is not valid",
      });
      return;
    }

    if (!validPassword) {
      reply.send({
        error:
          "Password must be between 8 and 30 characters, and include at least 1 lowercase and one uppercase letters, and 1 special character @$!%*?&",
      });
      return;
    }

    if (!validEmail) {
      reply.send({ error: "Email address is not valid" });
      return;
    }

    if (
      userAlreadyExists.found &&
      userAlreadyExists.username &&
      userAlreadyExists.email
    ) {
      reply.send({
        error: `The username "${username.toLocaleLowerCase()}" and email "${email.toLowerCase()}" already exist`,
      });
      return;
    } else if (userAlreadyExists.found && userAlreadyExists.username) {
      reply.send({
        error: `The username "${username.toLowerCase()}" already exists`,
      });
      return;
    } else if (userAlreadyExists.found && userAlreadyExists.email) {
      reply.send({
        error: `The email "${email.toLowerCase()}" already exists`,
      });
      return;
    }

    createNewUserInUserDb(userDb, request.body);
    reply.send(request.body);
  }
);
