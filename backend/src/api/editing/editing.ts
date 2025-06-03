import {  FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { QueryFriend } from "../../user-database/friend-queries";
import { QueryUser } from "../../user-database/queries"; 
import UserDb from "../../user-database/UserDb";
import { UserStateType } from "../sign-in/sign-in";
import { fastify } from "../../server";
import bcrypt from "bcrypt"
import FormValidation from "../../utils/FormValidation";

type SimpleUpdate = {
  user: UserStateType;
  newValue: string;
};

type SecurityUpdate = {
  user: UserStateType;
  oldPass: string;
  newPass: string;
};

export default async function editingRoutes(fastify: FastifyInstance) {
fastify.post(
  "/api/editing/username",
  async function (
    request: FastifyRequest<{ Body: SimpleUpdate }>,
    reply
  ) {
    const user = request.body.user;
    const { newValue } = request.body;
    try {
      const userDbInstance = new UserDb("/app/database/test.db");
      const userDb = userDbInstance.openDb();
	  // check if username already exist in db and if so return an error
	  const usernameExists = userDb.prepare(QueryUser.FIND_USERNAME_BY_USERNAME).get(newValue);
      if (usernameExists) {
        reply.code(400).send({ errorMessage: "Username already taken" });
        return;
      }
      const validation = new FormValidation ( "", newValue, "" );
	  const validatedUsername = validation.isUsernameValid();
	  if (!validatedUsername){
		reply.code(400).send({errorMessage: "Invalid username!"});
		return;
	  }
	  const set_new_username = userDb.prepare(QueryUser.SET_NEW_USERNAME);
	  set_new_username.run(newValue, user.id);
      reply.code(200).send({message: "Success!"});
      return;
    } catch (error) {
      console.log(error);
      reply.code(500).send({errorMessage: "Something went wrong!"});
      return;
    }
  }
);

fastify.post(
  "/api/editing/email",
  async function (
    request: FastifyRequest<{ Body: SimpleUpdate }>,
    reply
  ) {
    const user = request.body.user;
    const { newValue } = request.body;
    try {
      const userDbInstance = new UserDb("/app/database/test.db");
      const userDb = userDbInstance.openDb();
	  // check if email already exist in db and if so return an error
	  const emailExists = userDb.prepare(QueryUser.FIND_EMAIL_BY_EMAIL).get(newValue);
      if (emailExists) {
        reply.code(400).send({ errorMessage: "Email already taken" });
        return;
      }
	  const validation = new FormValidation ( newValue, "", "" );
	  const validatedEmail = validation.isEmailValid();
	  if (!validatedEmail){
		reply.code(400).send({errorMessage: "Invalid email!"});
		return;
	  }
	  const set_new_email = userDb.prepare(QueryUser.SET_NEW_EMAIL);
	  set_new_email.run(newValue, user.id);
      reply.code(200).send({message: "Success!"});
      return;
    } catch (error) {
      console.log(error);
      reply.code(500).send({errorMessage: "Something went wrong!"});
      return;
    }
  }
);

fastify.post(
  "/api/editing/password",
  async function (
    request: FastifyRequest<{ Body: SecurityUpdate }>,
    reply
  ) {
    const { user, oldPass, newPass } = request.body;
	const { email, username } = request.body.user;

	try {
      const userDbInstance = new UserDb("/app/database/test.db");
      const userDb = userDbInstance.openDb();
	  // confirm correct password
	  const passwordStatement = userDb.prepare(QueryUser.FIND_PASSWORD_BY_ID);
	  const result = passwordStatement.get(user.id) as { password: string };
	  const isPasswordValid = await bcrypt.compare(oldPass, result.password);
	  if (!isPasswordValid){
		reply.code(400).send({errorMessage: `Old password could not be verified`});
        return;
	  }
	  // confirm valid new password
	  const validation = new FormValidation ( email, username, newPass );
	  const newPassIsValid = validation.isPasswordValid();
	  if (!newPassIsValid){
		reply.code(400).send({errorMessage: `New password does not fulfill requirements`});
        return;
	  }
      //update stored value of new password+salt
	  const salt = await bcrypt.genSalt(10);
	  const hashedPassword = await bcrypt.hash(newPass, salt);
	  const updatePassStatement = userDb.prepare(QueryUser.SET_NEW_PASSWORD)
	  updatePassStatement.run(hashedPassword, user.id);
	//   const confirmNewPassHasChangedStmt = userDb.prepare(QueryUser.FIND_PASSWORD_BY_ID);
	//   const storedHashed = confirmNewPassHasChangedStmt.get(user.id);
	//   if (storedHashed !== hashedPassword)
	// 	reply.code(500).send({errorMessage: "Password was not stored properly!"});
	  reply.code(200).send({message: "Success!"});
      return;
    } catch (error) {
      console.log(error);
      reply.code(500).send({errorMessage: "Something went wrong!"});
      return;
    }
  }
);
    //   reply.code(501).send({errorMessage: `result: ${result.password}, isPasswordValid: ${isPasswordValid}`});

}