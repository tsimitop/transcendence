import { FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { fastify } from "../../server";
import FormValidation from "../../utils/FormValidation";
import UserDb from "../../user-database/UserDb";

export type SignUpType = {
  email: string;
  username: string;
  password: string;
};

fastify.post(
  "/api/sign-up",
  async function (request: FastifyRequest<{ Body: SignUpType }>, reply) {
    const { email, username, password } = request.body;
    if (!email?.trim() || !username?.trim() || !password?.trim()) {
      reply.send({ errorMessage: "Invalid input" });
      return;
    }

    // backend Dockerfile changes the path to /app and runs CMD form /app:
    const userDbInstance = new UserDb("database/test.db");
    const userDb = userDbInstance.openDb();
    userDbInstance.createUserTableInUserDb(userDb);
	userDbInstance.createFriendTableDb(userDb);

    const userAlreadyExists = userDbInstance.userExistsInUserDb(
      userDb,
      email,
      username
    );
    const validation = new FormValidation(email, username, password);

    const { validEmail, validUsername, validPassword } =
      validation.isFormValid();

    if (!validEmail) {
      reply.send({ errorMessage: FormValidation.emailError });
      return;
    }

    if (!validUsername) {
      reply.send({ errorMessage: FormValidation.usernameError });
      return;
    }

    if (!validPassword) {
      reply.send({ errorMessage: FormValidation.passwordError });
      return;
    }

    // if (!validEmail || !validUsername || !validPassword) {
    //   reply.send({
    //     errorMessage: SignUpValidation.errorMessage,
    //     emailError: !validEmail ? SignUpValidation.emailError : undefined,
    //     usernameError: !validUsername
    //       ? SignUpValidation.usernameError
    //       : undefined,
    //     passwordError: !validPassword
    //       ? SignUpValidation.passwordError
    //       : undefined,
    //   });
    //   return;
    // }

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
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      await userDbInstance.createNewUserInUserDb(
        userDb,
        request.body,
        hashedPassword,
		"default.png"
      );
    } catch (error) {
		console.log(error);
		reply.send({
			errorMessage: "User could not be inserted in database.",
		});
		return;
    }
	try {
		await userDbInstance.updateFriendDb(
		  userDb,
		  request.body.username,
		);
	} catch (error) {
		console.log(error);
		reply.send({
			errorMessage: "User '" + request.body.username + "' could not be inserted in friend database.",
		});
		return;
    }
    reply.send(request.body);
  }
);
