const table = "test_users";

export enum Query {
  CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
		id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		email TEXT NOT NULL,
		username TEXT NOT NULL,
		password TEXT NOT NULL
	);`,

  INSERT_NEW_USER = `INSERT INTO ${table}(email, username, password)
	VALUES(?, ?, ?);`,

  SELECT_USER_TABLE = `SELECT * FROM ${table}`,
}
