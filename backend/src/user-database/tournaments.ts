const table = "tournaments";

export enum QueryTournament {
	CREATE_TOURNAMENTS_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
	id INTEGER PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	created_by INTEGER REFERENCES test_users(id),
	status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed'))
	);`,
}
