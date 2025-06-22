import {  FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { QueryUser } from "../../user-database/queries"; 
import UserDb from "../../user-database/UserDb";
import { UserStateType } from "../sign-in/sign-in";
import { fastify } from "../../server";
import bcrypt from "bcrypt"
import FormValidation from "../../utils/FormValidation";
import path from "path";
import fs from "fs";
import { pipeline } from 'stream';
import { promisify } from 'util';

type SimpleUpdate = {
  user: UserStateType;
  newValue: string;
};

type SecurityUpdate = {
  user: UserStateType;
  oldPass: string;
  newPass: string;
};

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
		reply.code(400).send({ errorMessage: validation.getUsernameError() });
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
		reply.code(400).send({ errorMessage: validation.getEmailError() });
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
	  // confirm old password is correct
	  const passwordStatement = userDb.prepare(QueryUser.FIND_PASSWORD_BY_ID);
	  const result = passwordStatement.get(user.id) as { password: string };
	  const isPasswordValid = await bcrypt.compare(oldPass, result.password);
	  if (!isPasswordValid){
		reply.code(400).send({errorMessage: `Old password could not be verified`});
        return;
	  }
	  // confirm new password is valid
	  const validation = new FormValidation ( email, username, newPass );
	  const newPassIsValid = validation.isPasswordValid();
	  if (!newPassIsValid){
		reply.code(400).send({ errorMessage: validation.getPasswordError() });
        return;
	  }
      //update stored value of new password as hashedPassword
	  const salt = await bcrypt.genSalt(10);
	  const hashedPassword = await bcrypt.hash(newPass, salt);
	  const updatePassStatement = userDb.prepare(QueryUser.SET_NEW_PASSWORD)
	  updatePassStatement.run(hashedPassword, user.id);
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
  "/api/editing/avatar",
  async function (request, reply
  ) {
	const parts = request.parts(); // async iterable for all parts
	const pump = promisify(pipeline);
    let filePart: any;
    let userId;
	let filename;

	try {
	  for await (const part of parts) {
        if (part.type === 'file') {
	      const sanitizedFilename = part.filename.replace(/\s+/g, '');
	      const finalFilename = `upload-${Date.now()}-${sanitizedFilename}`;
	      const uploadPath = path.join(__dirname, '../../../avatars', finalFilename);
	      await pump(part.file, fs.createWriteStream(uploadPath));
	      filePart = {
	        filename: finalFilename,
	        filepath: uploadPath,
	      };
	      filename = finalFilename;
        } else if (part.type === 'field' && part.fieldname === 'userId') {
          userId = part.value;
        }
      }

      if (!filePart) {
        reply.code(400).send({ errorMessage: "No file uploaded" });
        return;
      }

      if (!userId) {
        reply.code(400).send({ errorMessage: "No userId provided" });
        return;
      }

      const userDbInstance = new UserDb("/app/database/test.db");
      const userDb = userDbInstance.openDb();
      const storeAvatarStatement = userDb.prepare(QueryUser.SET_NEW_AVATAR);
      storeAvatarStatement.run(filename, userId);
    } catch (error) {
      reply.code(500).send({
        errorMessage: `Something went wrong while uploading the avatar!, Error: ${error}`,
      });
      return;
    }

    reply.send({message: `Avatar uploaded`});
});
