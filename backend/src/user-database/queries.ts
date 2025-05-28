const table = "test_users";

export enum QueryUser {
  CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
		id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		email TEXT NOT NULL,
		username TEXT NOT NULL,
		password TEXT NOT NULL,
		jwt_refresh_token TEXT,
		has_2fa BOOLEAN DEFAULT false,
		totp_secret TEXT DEFAULT ''
	);`,
  INSERT_NEW_USER = `INSERT INTO ${table}(email, username, password)
	VALUES(?, ?, ?);`,
  FIND_EMAIL_BY_EMAIL = `SELECT email FROM ${table} WHERE email = ?`,
  FIND_EMAIL_BY_USERNAME = `SELECT email FROM ${table} WHERE username = ?`,
  FIND_USERNAME_BY_USERNAME = `SELECT username FROM ${table} WHERE username = ?`,
  FIND_USERNAME_BY_EMAIL = `SELECT username FROM ${table} WHERE email = ?`,
  FIND_PASSWORD_BY_USERNAME = `SELECT password FROM ${table} WHERE username = ?`,
  FIND_PASSWORD_BY_EMAIL = `SELECT password FROM ${table} WHERE email = ?`,
  FIND_ID_BY_EMAIL = `SELECT id FROM ${table} WHERE email = ?`,
  FIND_ID_BY_USERNAME = `SELECT id FROM ${table} WHERE username = ?`,
  FIND_ID_BY_HASHED_REFRESH_TOKEN = `SELECT id FROM ${table} WHERE jwt_refresh_token = ?`,
  FIND_USERNAME_BY_HASHED_REFRESH_TOKEN = `SELECT username FROM ${table} WHERE jwt_refresh_token = ?`,
  FIND_EMAIL_BY_HASHED_REFRESH_TOKEN = `SELECT email FROM ${table} WHERE jwt_refresh_token = ?`,
  FIND_JWT_REFRESH_TOKEN_BY_ID = `SELECT jwt_refresh_token FROM ${table} WHERE id = ?`,
  GET_ALL_JWT_REFRESH_TOKENS = `SELECT jwt_refresh_token FROM ${table}`,
  SELECT_ALL_USERNAMES = `SELECT username FROM ${table};`,
  UPDATE_JWT_REFRESH_TOKEN = `UPDATE ${table} SET jwt_refresh_token = ? WHERE id = ?`,
  SELECT_USER_TABLE = `SELECT * FROM ${table};`,
  UPDATE_HAS_2FA = `UPDATE ${table} SET has_2fa = ? WHERE id = ?`,
  UPDATE_TOTP_SECRET = `UPDATE ${table} SET totp_secret = ? WHERE id = ?`,
  GET_2FA_STATUS = `SELECT has_2fa FROM ${table} WHERE id = ?`,
  GET_TOTP_SECRET = `SELECT totp_secret FROM ${table} WHERE id = ?`,
  SELECT_ALL_USERS = `SELECT id FROM ${table}`,
  FIND_ID_USERNAME_EMAIL = `SELECT id, username, email FROM ${table} WHERE username = ?`,
  MATCH_EACH_ID_TO_USERNAME = `SELECT username FROM ${table} WHERE id = ?`,
}
