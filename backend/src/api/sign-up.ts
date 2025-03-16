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
  console.log("********************* new user: *********************");

  const newUserStatement = userDb.prepare(QueryUser.INSERT_NEW_USER);
  newUserStatement.run(user.email, user.username, user.password);

  const userTable = userDb.prepare(QueryUser.SELECT_USER_TABLE).all();
  console.log(userTable);
  console.log("*****************************************************");
};

const userExistsInUserDb = function (
  userDb: DbType,
  email: string,
  username: string
): { found: boolean; email: string; username: string } {
  // const stmt = userDb.prepare(
  //   "SELECT email, username FROM test_users WHERE email = ? OR username = ?"
  // );
  const findEmail = userDb.prepare(
    "SELECT email FROM test_users WHERE email = ?"
  );

  const findUsername = userDb.prepare(
    "SELECT username FROM test_users WHERE username = ?"
  );

  const hasEmail = findEmail.all(email);
  const hasUsername = findUsername.all(username);
  const found = hasEmail.length || hasUsername.length;
  console.log(`------------- SEARCHING FOR ${username} -------------`);
  console.log(hasEmail);
  console.log(`-----------------------------------------------------`);
  return {
    found: !!found,
    email: hasEmail.length ? email : "",
    username: hasUsername.length ? username : "",
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
