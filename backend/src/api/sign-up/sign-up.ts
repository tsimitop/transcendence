import { FastifyRequest } from "fastify";
import Database, { Database as DbType } from "better-sqlite3";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import { QueryUser } from "../../queries";
import SignUpValidation from "./SignUpValidation";

type SignUpType = {
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

const createNewUserInUserDb = function (userDb: DbType, user: SignUpType) {
  const newUserStatement = userDb.prepare(QueryUser.INSERT_NEW_USER);
  const saltRounds = 10;
  const password = user.password;
  bcrypt.genSalt(saltRounds, (error, salt) => {
    if (error) {
      throw error;
    }

    bcrypt.hash(password, salt, (error, hashedPassword) => {
      if (error) {
        throw error;
      }

      newUserStatement.run(
        user.email.trim().toLowerCase(),
        user.username.trim(),
        hashedPassword
      );
    });
  });

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
  const findEmailStatement = userDb.prepare(QueryUser.FIND_EMAIL_BY_EMAIL);
  const findUsernameStatement = userDb.prepare(
    QueryUser.FIND_USERNAME_BY_USERNAME
  );

  const emailsList = findEmailStatement.all(email.toLowerCase());
  const usernamesList = findUsernameStatement.all(username.toLowerCase());
  const found = emailsList.length || usernamesList.length;
  return {
    found: !!found,
    email: emailsList.length ? email : "",
    username: usernamesList.length ? username : "",
  };
};

fastify.post(
  "/api/sign-up",
  function (request: FastifyRequest<{ Body: SignUpType }>, reply) {
    const { email, username, password } = request.body;
    if (!email?.trim() || !username?.trim() || !password?.trim()) {
      reply.send({ errorMessage: "Invalid input" });
      return;
    }

    const userDb = openUserDb("database/test.db");
    createUserTableInUserDb(userDb);

    const userAlreadyExists = userExistsInUserDb(userDb, email, username);
    const validation = new SignUpValidation(email, username, password);

    const { validEmail, validUsername, validPassword } =
      validation.isFormValid();

    if (!validEmail || !validUsername || !validPassword) {
      reply.send({
        errorMessage: SignUpValidation.errorMessage,
        emailError: !validEmail ? SignUpValidation.emailError : undefined,
        usernameError: !validUsername
          ? SignUpValidation.usernameError
          : undefined,
        passwordError: !validPassword
          ? SignUpValidation.passwordError
          : undefined,
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

    try {
      createNewUserInUserDb(userDb, request.body);
    } catch (error) {
      console.log(error);
      reply.send({
        errorMessage: "User could not be inserted in database.",
      });
      return;
    }
    reply.send(request.body);
  }
);
