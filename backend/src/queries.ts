const table = "test_users";

export enum QueryUser {
  CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
		id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		email TEXT NOT NULL,
		username TEXT NOT NULL,
		password TEXT NOT NULL
	);`,
  INSERT_NEW_USER = `INSERT INTO ${table}(email, username, password)
	VALUES(?, ?, ?);`,
  FIND_EMAIL = `SELECT email FROM test_users WHERE email = ?`,
  FIND_USERNAME = `SELECT username FROM test_users WHERE username = ?`,
  SELECT_USER_TABLE = `SELECT * FROM ${table}`,
}
