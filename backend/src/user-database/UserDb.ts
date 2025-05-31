import { Database as DbType } from "better-sqlite3";
import bcrypt from "bcrypt";
import Sqlite from "../models/Sqlite";
import { QueryUser } from "./queries";
import { QueryFriend } from "./friend-queries";

import { SignUpType } from "../api/sign-up/sign-up";
import { UserStateType } from "../api/sign-in/sign-in";

type User = {
  id: number;
  email: string;
  username: string;
  password: string;
  jwt_refresh_token?: string | null;
  has_2fa: boolean;
  totp_secret: string;
};

class UserDb extends Sqlite {
  constructor(private userDbPath: string) {
    super(userDbPath);
  }

  public createUserTableInUserDb(userDb: DbType) {
    userDb.prepare(QueryUser.CREATE_TABLE).run();
  }

  public createFriendTableDb(userDb: DbType) {
    userDb.prepare(QueryFriend.CREATE_FRIEND_TABLE).run();
  }

  public async createNewUserInUserDb(
    userDb: DbType,
    user: SignUpType,
    hashedPassword: string,
	avatar: string
  ) {
    const newUserStatement = userDb.prepare(QueryUser.INSERT_NEW_USER);

    newUserStatement.run(
      user.email.trim().toLowerCase(),
      user.username.trim(),
      hashedPassword,
	  avatar
    );
  }
   // const userTable = userDb.prepare(QueryUser.SELECT_USER_TABLE).all();

  // 1. Add new user to existing users' friendship status
  // 2. Add all existing users to new user's friendship status
  public async updateFriendDb(userDb: DbType, newUsername: string) {
    const username: string = newUsername.trim();
    const getUserIdStatement = userDb.prepare(QueryUser.FIND_ID_BY_USERNAME);
	const result = getUserIdStatement.get(username) as { id: number } | undefined;
    const newUserId = result?.id;
    if (!newUserId) {
	  console.log("Username" + username + " id not found");
      throw new Error(`User with username '${username}' not found`);
    }

    const getAllUsersStatement = userDb.prepare(QueryUser.SELECT_ALL_USERS);
	const allUsers = getAllUsersStatement.all() as User[];
	const existingUsers = allUsers.filter((u) => u.id !== newUserId);
    const insertFriendStatement = userDb.prepare(QueryFriend.INSERT_NEW_FRIEND_USER);
    for (const existingUser of existingUsers) {
      insertFriendStatement.run(newUserId, existingUser.id, 'default');
      insertFriendStatement.run(existingUser.id, newUserId, 'default');
    }
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
        return { email: "", username: "", isSignedIn: false, id: "", avatar: "" };
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
	  const actualUsername =
      usernamesList[0]?.username ||
      (
        findUsernameByEmailStatement.all(emailsList[0]?.email) as [
          { username: string }
        ]
      )[0]?.username;
      const findIdByEmailStatement = userDb.prepare(QueryUser.FIND_ID_BY_EMAIL);
	  const avatarStatement = userDb.prepare(QueryUser.FIND_AVATAR_BY_USERNAME);
	  const avatarResult = avatarStatement.get(actualUsername) as { avatar: string };
	  const avatar = avatarResult?.avatar;

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
		  avatar: avatar || "",
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

/**
 * @brief Finds the username by user ID
 * @param userDb - The SQLite database instance
 * @param userId - The user ID to search for
 * @returns The username associated with the user ID, or an empty string if not found
 */
  public findUsernameByUserId(userDb: DbType, userId: string): string {
	const stmt = userDb.prepare(QueryUser.FIND_USERNAME_BY_ID);
	const result = stmt.get(userId) as { username: string } | undefined;
	return result?.username || '';
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

  public findAvatarByHashedRefreshToken(
    userDb: DbType,
    hashedRefreshToken: string
  ) {
    const findEmailStatement = userDb.prepare(
      QueryUser.FIND_AVATAR_BY_HASHED_REFRESH_TOKEN
    );
    const avatarsList = findEmailStatement.all(hashedRefreshToken) as [
      { avatar: string }
    ];
    if (!avatarsList.length) {
      return "";
    }

    return avatarsList[0].avatar;
  }

  public updateHas2Fa(userDb: DbType, id: string, has2Fa: number) {
    const update2FaStatement = userDb.prepare(QueryUser.UPDATE_HAS_2FA);
    update2FaStatement.run(has2Fa, id);
  }

  public updateTotpSecret(userDb: DbType, id: string, totpSecret: string) {
    const updateTotpSecretStatement = userDb.prepare(
      QueryUser.UPDATE_TOTP_SECRET
    );
    updateTotpSecretStatement.run(totpSecret, id);
  }

  public get2FaStatus(userDb: DbType, id: string) {
    const status2FaStatement = userDb.prepare(QueryUser.GET_2FA_STATUS);
    const result = status2FaStatement.all(id) as [{ has_2fa: boolean }];
    const has2Fa = result[0].has_2fa;
    return has2Fa;
  }

  public getTotpSecret(userDb: DbType, id: string) {
    const getTotpStatement = userDb.prepare(QueryUser.GET_TOTP_SECRET);
    const result = getTotpStatement.all(id) as [{ totp_secret: string }];
    const totpSecret = result[0].totp_secret;
    return totpSecret;
  }

//   public sendFriendRequest(userDbUser: DbType, userDbFriend: DbType) {

//   }
}

/*
New methods:

sendFriendRequest(userId, friendId)
acceptFriendRequest(userId, friendId)
getFriends(userId) -> for list
removeFriend(userId, friendId)
blockUser(userId, friendId)

Existing:
findUserInDb() or userExistsInUserDb() to look up id values from usernames.
*/

export default UserDb;
