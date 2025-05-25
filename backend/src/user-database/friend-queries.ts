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
	GET_FRIENDSHIP_STATUS = `SELECT status FROM ${table} WHERE user_id = ? AND friend_id = ?;`,
	SET_BIDIRECTIONAL_STATUS = `UPDATE ${table} SET status = ? WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?);`,
	SET_ONEDIRECTIONAL_STATUS = `UPDATE ${table} SET status = ? WHERE user_id = ? AND friend_id = ?;`,
}
