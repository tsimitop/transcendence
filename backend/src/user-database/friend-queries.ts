const table = "friends_users";

// status: 'pending', 'accepted', 'rejected', 'blocked'
export enum QueryFriend {
  CREATE_FRIEND_TABLE = `CREATE TABLE IF NOT EXISTS ${table}(
	user_id INTEGER NOT NULL,
	friend_id INTEGER NOT NULL,
	status TEXT DEFAULT 'default',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, friend_id),
	FOREIGN KEY (user_id) REFERENCES test_users(id),
	FOREIGN KEY (friend_id) REFERENCES test_users(id)
	);`,
	INSERT_NEW_FRIEND_USER = `INSERT INTO ${table} (user_id, friend_id, status) VALUES (?, ?, ?);`,
}
