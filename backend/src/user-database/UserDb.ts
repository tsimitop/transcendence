import { Database as DbType } from "better-sqlite3";
import bcrypt from "bcrypt";
import Sqlite from "../models/Sqlite";
import { QueryUser } from "./queries";

import { SignUpType } from "../api/sign-up/sign-up";
import { UserStateType } from "../api/sign-in/sign-in";

class UserDb extends Sqlite {
  constructor(private userDbPath: string) {
    super(userDbPath);
  }

  public createUserTableInUserDb(userDb: DbType) {
    userDb.prepare(QueryUser.CREATE_TABLE).run();
  }

  public createNewUserInUserDb(userDb: DbType, user: SignUpType) {
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
  }

  public userExistsInUserDb(
    userDb: DbType,
    email: string,
    username: string
  ): { found: boolean; email: string; username: string } {
    // const stmt = userDb.prepare(
    //   "SELECT email, username FROM test_users WHERE email = ? OR username = ?"
    // );
    const findEmailStatement = userDb.prepare(QueryUser.FIND_EMAIL_BY_EMAIL);
    const findUsernameStatement = userDb.prepare(
      QueryUser.SELECT_ALL_USERNAMES
    );
    const emailsList = findEmailStatement.all(email.toLowerCase());
    const usernamesList = findUsernameStatement.all() as { username: string }[];
    let isUsernameNew = true;
    for (const usernameInDb of usernamesList) {
      if (usernameInDb.username.toLowerCase() === username.toLowerCase()) {
        isUsernameNew = false;
        break;
      }
    }
    const found = emailsList.length || !isUsernameNew;
    return {
      found: !!found,
      email: emailsList.length ? email : "",
      username: !isUsernameNew ? username : "",
    };
  }

  findUserInDb = async function (
    userDb: DbType,
    usernameOrEmail: string,
    password: string
  ): Promise<UserStateType> {
    const findEmailByEmailStatement = userDb.prepare(
      QueryUser.FIND_EMAIL_BY_EMAIL
    );
    const findUsernameByUsernameStatement = userDb.prepare(
      QueryUser.FIND_USERNAME_BY_USERNAME
    );
    const emailsList = findEmailByEmailStatement.all(
      usernameOrEmail.trim().toLowerCase()
    ) as { email: string }[];
    const usernamesList = findUsernameByUsernameStatement.all(
      usernameOrEmail.trim()
    ) as {
      username: string;
    }[];
    const isLoginByEmail = emailsList.length;
    const isLoginByUsername = usernamesList.length;
    const foundUser = isLoginByEmail || isLoginByUsername;
    if (!foundUser) {
      return { email: "", username: "", isSignedIn: false, id: "" };
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
    const findEmailByUsernameStatement = userDb.prepare(
      QueryUser.FIND_EMAIL_BY_USERNAME
    );
    const findUsernameByEmailStatement = userDb.prepare(
      QueryUser.FIND_USERNAME_BY_EMAIL
    );
    const findIdByUsernameStatement = userDb.prepare(
      QueryUser.FIND_ID_BY_USERNAME
    );
    const findIdByEmailStatement = userDb.prepare(QueryUser.FIND_ID_BY_EMAIL);
    const user: UserStateType = {
      id: isLoginByEmail
        ? (
            findIdByEmailStatement.all(emailsList[0]?.email) as [{ id: string }]
          )[0].id
        : (
            findIdByUsernameStatement.all(usernamesList[0]?.username) as [
              { id: string }
            ]
          )[0].id,
      email:
        emailsList[0]?.email ||
        (
          findEmailByUsernameStatement.all(usernamesList[0]?.username) as [
            { email: string }
          ]
        )[0].email,
      username:
        usernamesList[0]?.username ||
        (
          findUsernameByEmailStatement.all(emailsList[0]?.email) as [
            { username: string }
          ]
        )[0].username,
      isSignedIn: isPasswordValid,
    };
    return user;
  };

  public hashRefreshTokenAndUpdateDb(
    userDb: DbType,
    userId: string,
    refreshtoken: string
  ) {
    const saltRounds = 10;
    bcrypt.genSalt(saltRounds, (error, salt) => {
      if (error) {
        throw error;
      }
      bcrypt.hash(refreshtoken, salt, (error, hashedRefreshToken) => {
        if (error) {
          throw error;
        }
        const updateUserJwtStatement = userDb.prepare(
          QueryUser.UPDATE_JWT_REFRESH_TOKEN
        );
        updateUserJwtStatement.run(hashedRefreshToken, userId);
      });
    });
  }

  public findRefreshToken(userDb: DbType, user: UserStateType) {
    const findRefreshTokenStatement = userDb.prepare(
      QueryUser.FIND_JWT_REFRESH_TOKEN_BY_ID
    );
    const refreshTokensList = findRefreshTokenStatement.all(user.id) as [
      { jwt_refresh_token: string }
    ];
    return refreshTokensList;
  }
}

export default UserDb;
