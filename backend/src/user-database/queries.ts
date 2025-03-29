const table = "test_users";

export enum QueryUser {
  CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
		id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		email TEXT NOT NULL,
		username TEXT NOT NULL,
		password TEXT NOT NULL,
		jwt_refresh_token TEXT
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
  FIND_JWT_REFRESH_TOKEN_BY_ID = `SELECT jwt_refresh_token FROM ${table} WHERE id = ?`,
  SELECT_ALL_USERNAMES = `SELECT username FROM ${table};`,
  UPDATE_JWT_REFRESH_TOKEN = `UPDATE ${table} SET jwt_refresh_token = ? WHERE id = ?`,
  SELECT_USER_TABLE = `SELECT * FROM ${table};`,
}
