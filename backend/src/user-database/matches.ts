const table = "matches";

// type: local, remote, tournament

export enum QueryMatch {
  CREATE_MATCH_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
    match_id INTEGER PRIMARY KEY,
	type TEXT NOT NULL CHECK (type IN ('local', 'remote', 'tournament')),
	user_id_first INTEGER REFERENCES test_users(id),
	user_id_second INTEGER REFERENCES test_users(id),
	alias_first TEXT NOT NULL,
	alias_second TEXT NOT NULL,
	winner_alias TEXT,
	winner_id INTEGER REFERENCES test_users(id),
	tournament_id REFERENCES tournaments(id),
	first_score INTEGER,
	second_score INTEGER,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`,
	INSERT_NEW_MATCH = `INSERT INTO ${table}(type, user_id_first, user_id_second, alias_first, alias_second) VALUES(?, ?, ?, ?, ?);`,
	GET_LOCAL_MATCHES_FOR_USER = `SELECT * FROM ${table} WHERE type = 'local' AND (user_id_first = ? OR user_id_second = ?) ORDER BY date DESC;`,
	GET_REMOTE_MATCHES_FOR_USER = `SELECT * FROM ${table} WHERE type = 'remote' AND (user_id_first = ? OR user_id_second = ?) ORDER BY date DESC;`,

}
