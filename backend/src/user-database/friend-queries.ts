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
	LIST_OF_PENDING = `SELECT user_id FROM ${table} WHERE friend_id = ? AND status = 'pending'`,
	LIST_OF_ACCEPTED = `
	SELECT user_id AS friend_id FROM ${table} WHERE friend_id = ? AND status = 'accepted'
	UNION
	SELECT friend_id FROM ${table} WHERE user_id = ? AND status = 'accepted'
	`,
	LIST_OF_BLOCKED_BY_ME = `SELECT friend_id FROM ${table} WHERE user_id = ? AND status = 'blocked'`,
	LIST_ALL_BLOCKED = `
	SELECT user_id, friend_id AS blocked_user_id
	FROM ${table}
	WHERE status = 'blocked';
	`,
	LIST_OF_FRIENDS = `SELECT friend_id FROM ${table} WHERE user_id = ? AND status = 'accepted'`,
	LIST_OF_BLOCKED = `SELECT friend_id FROM ${table} WHERE user_id = ? AND status = 'blocked'`,
}
