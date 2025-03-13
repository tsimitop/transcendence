import { FastifyRequest } from "fastify";
import { fastify } from "./sign-in";
import Database from "better-sqlite3";
import { Query } from "../queries";

type SignUpDataType = {
  email: string;
  username: string;
  password: string;
};

const createNewUser = function (user: SignUpDataType) {
  console.log("********************* new user: *********************");
  // backend Dockerfile changes the path to /app and runs CMD form /app:
  const db = new Database("database/test.db");
  db.prepare(Query.CREATE_TABLE).run();

  const newUserStatement = db.prepare(Query.INSERT_NEW_USER);
  newUserStatement.run(user.email, user.username, user.password);

  const result = db.prepare(Query.SELECT_USER_TABLE).all();
  console.log(result);
  console.log("*****************************************************");
};

fastify.post(
  "/api/sign-up",
  function (request: FastifyRequest<{ Body: SignUpDataType }>, reply) {
    const { email, username, password } = request.body;
    if (!email?.trim() || !username?.trim() || !password?.trim()) {
      reply.send({ error: "invalid input" });
      return;
    }

    createNewUser(request.body);
    reply.send(request.body);
  }
);
