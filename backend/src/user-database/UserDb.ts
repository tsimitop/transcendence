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

  public async createNewUserInUserDb(
    userDb: DbType,
    user: SignUpType,
    hashedPassword: string
  ) {
    const newUserStatement = userDb.prepare(QueryUser.INSERT_NEW_USER);

    newUserStatement.run(
      user.email.trim().toLowerCase(),
      user.username.trim(),
      hashedPassword
    );

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
  ): Promise<UserStateType | null> {
    try {
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
              findIdByEmailStatement.all(emailsList[0]?.email) as [
                { id: string }
              ]
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
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  public async updateHashedRefreshToken(
    userDb: DbType,
    userId: string,
    hashedRefreshToken: string
  ) {
    const updateUserJwtStatement = userDb.prepare(
      QueryUser.UPDATE_JWT_REFRESH_TOKEN
    );
    updateUserJwtStatement.run(hashedRefreshToken, userId);
  }

  public findHashedRefreshTokenByUserId(userDb: DbType, user: UserStateType) {
    const findRefreshTokenStatement = userDb.prepare(
      QueryUser.FIND_JWT_REFRESH_TOKEN_BY_ID
    );
    const refreshTokensList = findRefreshTokenStatement.all(user.id) as [
      { jwt_refresh_token: string }
    ];
    return refreshTokensList;
  }

  public async findHashedRefreshTokenByCookieRefreshToken(
    userDb: DbType,
    cookieRefreshToken: string
  ) {
    const findRefreshTokenStatement = userDb.prepare(
      QueryUser.GET_ALL_JWT_REFRESH_TOKENS
    );
    const hashedRefreshTokensList = findRefreshTokenStatement.all() as {
      jwt_refresh_token: string;
    }[];

    let hashedRefreshToken = "";
    try {
      for (const tokenObject of hashedRefreshTokensList) {
        const doTokensMatch = await bcrypt.compare(
          cookieRefreshToken,
          tokenObject.jwt_refresh_token
        );
        if (doTokensMatch) {
          hashedRefreshToken = tokenObject.jwt_refresh_token;
          break;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return hashedRefreshToken;
  }

  public findUserIdByHashedRefreshToken(
    userDb: DbType,
    hashedRefreshToken: string
  ) {
    const findIdStatement = userDb.prepare(
      QueryUser.FIND_ID_BY_HASHED_REFRESH_TOKEN
    );
    const idsList = findIdStatement.all(hashedRefreshToken) as [{ id: string }];
    if (!idsList.length) {
      return "";
    }

    return idsList[0].id;
  }

  public findUsernameByHashedRefreshToken(
    userDb: DbType,
    hashedRefreshToken: string
  ) {
    const findUsernameStatement = userDb.prepare(
      QueryUser.FIND_USERNAME_BY_HASHED_REFRESH_TOKEN
    );
    const usernamesList = findUsernameStatement.all(hashedRefreshToken) as [
      { username: string }
    ];
    if (!usernamesList.length) {
      return "";
    }

    return usernamesList[0].username;
  }

  public findEmailByHashedRefreshToken(
    userDb: DbType,
    hashedRefreshToken: string
  ) {
    const findEmailStatement = userDb.prepare(
      QueryUser.FIND_EMAIL_BY_HASHED_REFRESH_TOKEN
    );
    const emailsList = findEmailStatement.all(hashedRefreshToken) as [
      { email: string }
    ];
    if (!emailsList.length) {
      return "";
    }

    return emailsList[0].email;
  }
}

export default UserDb;
