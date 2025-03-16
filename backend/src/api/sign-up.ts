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
  newUserStatement.run(user.email, user.username, user.password);

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

  const emailsList = findEmailStatement.all(email);
  const usernamesList = findUsernameStatement.all(username);
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

    const result = userExistsInUserDb(userDb, email, username);
    console.log(result);
    if (result.found && result.username && result.email) {
      console.log(`${username} already exists, please choose a new username`);
      reply.send({
        error: `The username "${username}" and email "${email}" already exist`,
      });
      return;
    } else if (result.found && result.username) {
      console.log(`${username} already exists, please choose a new username`);
      reply.send({ error: `The username "${username}" already exists` });
      return;
    } else if (result.found && result.email) {
      console.log(`${email} already exists, please choose a new email`);
      reply.send({ error: `The email "${email}" already exists` });
      return;
    }

    createNewUserInUserDb(userDb, request.body);
    reply.send(request.body);
  }
);
