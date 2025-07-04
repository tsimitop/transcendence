import {  FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { QueryFriend } from "../../user-database/friend-queries";
import { QueryUser } from "../../user-database/queries"; 
import UserDb from "../../user-database/UserDb";
import { UserStateType } from "../sign-in/sign-in";
import { fastify } from "../../server";
import { getUserSocket, blockedUsers } from "../../websocket/WebSocket";
import { connectedUsers } from '../../websocket/WebSocket';

const STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  DEFAULT: 'default'
};

interface FriendRequestBody {
  userState: UserStateType;
  userIdBtn: number;
}

interface FriendshipStatus {
  status: string;
}

interface PendingInfo {
	id: number;
	username: string;
}

// created friendships
fastify.post('/api/friends', async function (
	request: FastifyRequest<{Body: FriendRequestBody}>,
	 reply: FastifyReply) {

	const user = request.body.userState;
	const targetUser = request.body.userIdBtn;
  	const currentUserId = user.id;
	const currentUserIdNum = Number(currentUserId);
    if (!currentUserId) {
      return reply.status(401).send({ success: false, message: "Not authenticated" });
    }
      if (!targetUser || targetUser === currentUserIdNum) {
      return reply.status(400).send({ success: false, message: "Invalid target user." });
    }

  try {
	const userDbInstance = new UserDb("/app/database/test.db");
	let userDb;
	userDb = userDbInstance.openDb();
	const getuserIdBtnStatus = userDb.prepare(QueryFriend.GET_FRIENDSHIP_STATUS);
	const current_to_taget_result = getuserIdBtnStatus.get(currentUserIdNum, targetUser) as FriendshipStatus | undefined;
	const taget_to_current_result = getuserIdBtnStatus.get(targetUser, currentUserIdNum) as FriendshipStatus | undefined;

	if (!current_to_taget_result){
		throw Error ("Not ok current_to_taget_result.");
	}
	if (taget_to_current_result?.status !== "blocked") {
		if (taget_to_current_result?.status === "pending"){
			const bidirectional_friendship = userDb.prepare(QueryFriend.SET_BIDIRECTIONAL_STATUS);
			bidirectional_friendship.run(STATUS.ACCEPTED, currentUserId, targetUser, targetUser, currentUserId);
		}
		else {
			const pending_friendship = userDb.prepare(QueryFriend.SET_ONEDIRECTIONAL_STATUS);
			pending_friendship.run(STATUS.PENDING, currentUserId, targetUser);
		}
	}
	const getUsernameStmt = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);
	const fromUserRow = getUsernameStmt.get(currentUserIdNum) as { username: string } | undefined;
	const toUserRow = getUsernameStmt.get(targetUser) as { username: string } | undefined;

	userDb.close();

	if (fromUserRow?.username && toUserRow?.username) {
	const usernamesToNotify = [fromUserRow.username, toUserRow.username];

	usernamesToNotify.forEach(username => {
		const ws = getUserSocket(username);
		if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({ type: "SYSTEM", message: "Friendship request sent" }));
		ws.send(JSON.stringify({ type: "FRIENDSHIP_UPDATE" }));
		}
	});
	}		
    return reply.status(200).send({ success: true });
  } catch (error) {
    console.error("Friend request error:", error);
    return reply.status(500).send({ success: false, message: "Server error"});
  }
});

// block user
fastify.post('/api/friends/block', async function (
  request: FastifyRequest<{Body: FriendRequestBody}>,
  reply: FastifyReply) {

  const user = request.body.userState;
  const targetUser = request.body.userIdBtn;
  const currentUserId = user.id;
  const currentUserIdNum = Number(currentUserId);
  if (!currentUserId || !targetUser || targetUser === currentUserIdNum) {
    return reply.status(401).send({ success: false, message: "Error with users id" });
  }

  try {
	const userDbInstance = new UserDb("/app/database/test.db");
	let userDb;
	userDb = userDbInstance.openDb();
	const blocking_target = userDb.prepare(QueryFriend.SET_ONEDIRECTIONAL_STATUS); // block your target
	blocking_target.run(STATUS.BLOCKED, currentUserId, targetUser);
	const rejecting_friendship = userDb.prepare(QueryFriend.SET_ONEDIRECTIONAL_STATUS); // reject target's friendship
	rejecting_friendship.run(STATUS.REJECTED, targetUser, currentUserId);
	const getUsernameStmt = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);
	const blockingRow = getUsernameStmt.get(currentUserId) as { username: string } | undefined;
	const blockedRow = getUsernameStmt.get(targetUser) as { username: string } | undefined;
	userDb.close();

	if (blockingRow?.username) {
	const ws = getUserSocket(blockingRow.username);
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({ type: "SYSTEM", message: "User blocked" }));
		ws.send(JSON.stringify({ type: "FRIENDSHIP_UPDATE" }));
	}
	}
	if (blockedRow?.username) {
	const ws = getUserSocket(blockedRow.username);
	if (ws && ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({ type: "SYSTEM", message: "User blocked" }));
		ws.send(JSON.stringify({ type: "FRIENDSHIP_UPDATE" }));
	}
	}

	return reply.status(200).send({ success: true });
  } catch (error) {
    console.error("Friend request error:", error);
    return reply.status(500).send({ success: false, message: "Server error"});
  }
});

// return string array of all users pending requests towards current user to form list of pending in profile
fastify.post('/api/friends/pending', async function (
  request: FastifyRequest<{Body: FriendRequestBody}>,
	 reply: FastifyReply) {

	const user = request.body.userState;
  	const currentUserId = Number(user.id);
    if (!currentUserId) {
      return reply.status(401).send({ success: false, message: "Not authenticated" });
    }

  try {
	const userDbInstance = new UserDb("/app/database/test.db");
	let userDb;
	userDb = userDbInstance.openDb();
	const pendingStmt = userDb.prepare(QueryFriend.LIST_OF_PENDING);
	const pendingRequests = pendingStmt.all(currentUserId) as { user_id: number }[];
	const pendingUserIds = pendingRequests.map((row: { user_id: number }) => row.user_id);
	const usernameStmt = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);
	const pendingUserInfo: PendingInfo[] = pendingUserIds.map((id: number) => {
      const userRow = usernameStmt.get(id) as { username: string } | undefined;
      const username = userRow?.username || "Unknown";
      return { id, username };
    });
	userDb.close();
    return reply.status(200).send({ success: true, pendingUsers: pendingUserInfo });
  } catch (error) {
    console.error("Friend request error:", error);
    return reply.status(500).send({ success: false, message: "Server error"});
  }
});

//accept pending request
fastify.post('/api/friends/accept', async function (
  request: FastifyRequest<{Body: FriendRequestBody}>,
   reply: FastifyReply) {

  const user = request.body.userState;
  const targetUser = request.body.userIdBtn;
  const currentUserId = user.id;
  const currentUserIdNum = Number(currentUserId);
  if (!currentUserId || !targetUser || targetUser === currentUserIdNum) {
    return reply.status(401).send({ success: false, message: "Error with users id" });
  }

  try {
    const userDbInstance = new UserDb("/app/database/test.db");
    const userDb = userDbInstance.openDb();
    const bidirectional_friendship = userDb.prepare(QueryFriend.SET_BIDIRECTIONAL_STATUS);
    bidirectional_friendship.run(
      STATUS.ACCEPTED,
      currentUserId,
      targetUser,
      targetUser,
      currentUserId
    );

    const getUsernameStmt = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);
    const toUserRow = getUsernameStmt.get(targetUser) as { username: string } | undefined;
    const toUsername = toUserRow?.username;

    userDb.close();

	if (toUsername && user.username) {
	const usernamesToNotify = [toUsername, user.username];
	
	usernamesToNotify.forEach(username => {
		const ws = getUserSocket(username);
		if (ws && ws.readyState === WebSocket.OPEN) {
		const systemMsg = {
			type: "SYSTEM",
			message: "Friendship accepted"
		};
		ws.send(JSON.stringify(systemMsg));
		console.log(`[WS] Sent SYSTEM msg to ${username}`);

		// send profile update trigger
		const profileMsg = {
			type: "FRIENDSHIP_UPDATE",
			action: "ACCEPTED",
			updatedBy: user.username
		};
		ws.send(JSON.stringify(profileMsg));
		}
	});
	}

    return reply.status(200).send({ success: true });
  } catch (error) {
    console.error("Friend request error:", error);
    return reply.status(500).send({ success: false, message: "Server error" });
  }
});

fastify.post('/api/friends/list', async function (
  request: FastifyRequest<{ Body: { userState: UserStateType } }>,
  reply: FastifyReply
) {
  const user = request.body.userState;
  const currentUserId = Number(user.id);

  if (!currentUserId) {
    return reply.status(401).send({ success: false, message: "Not authenticated" });
  }

  try {
    const userDbInstance = new UserDb("/app/database/test.db");
    const userDb = userDbInstance.openDb();

    const stmt = userDb.prepare(QueryFriend.LIST_OF_ACCEPTED);
    const friendRows = stmt.all(currentUserId, currentUserId) as { friend_id: number }[];

    const friendIds = friendRows.map(r => r.friend_id);

    const getUsernames = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);
    const friends = friendIds.map((id: number) => {
      const row = getUsernames.get(id) as { username: string } | undefined;
      return row?.username;
    }).filter(Boolean);

    userDb.close();
    return reply.status(200).send({ success: true, friends });
  } catch (err) {
    console.error("Error fetching accepted friends:", err);
    return reply.status(500).send({ success: false, message: "Server error" });
  }
});

fastify.post('/api/friends/blocked', async function (
  request: FastifyRequest<{ Body: { userState: UserStateType } }>,
  reply: FastifyReply
) {
  const username = request.body.userState?.username;
  if (!username) {
    return reply.status(400).send({ success: false, message: "Missing user" });
  }

  const blocked = blockedUsers.get(username);
  const blockedUsernames = blocked ? Array.from(blocked) : [];

  return reply.status(200).send({ success: true, blockedUsernames });
});


// return string array of all friend's FriendStatus of current user
interface FriendStatus {
  online: string;
  username: string;
}

fastify.post('/api/friends/list_friend', async function (
  request: FastifyRequest<{Body: UserStateType;}>,
	 reply: FastifyReply) {
	const userId = request.body.id;
    if (!userId) {
      return reply.status(401).send({ success: false, errorMessage: `Not authenticated: ${userId}` });
    }

  try {
	const userDbInstance = new UserDb("/app/database/test.db");
	const userDb = userDbInstance.openDb();

	const friendsStmt = userDb.prepare(QueryFriend.LIST_OF_FRIENDS);
	const friends = friendsStmt.all(userId) as { friend_id: number }[];
	const friendsIds = friends.map((row) => row.friend_id);

	const usernameStmt = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);
	const connectedUsernames = Array.from(connectedUsers.keys());
	

    const friendStatuses: FriendStatus[] = friendsIds.map((id) => {
      const userRow = usernameStmt.get(id) as { username: string } | undefined;
	  if (!userRow?.username) return null;
      const isOnline = connectedUsernames.includes(userRow.username);
      return {
        username: userRow.username,
        online: isOnline ? "🟢" : "⚫"
      };
    })
	.filter(Boolean) as FriendStatus[];

	userDb.close();
    return reply.status(200).send({ success: true, friends: friendStatuses });
  } catch (error) {
    console.error("Friend list error:", error);
    return reply.status(500).send({ success: false, message: `Server error: ${error}`});
  }
});


interface BlockedUser {
  username: string;
}

fastify.post('/api/friends/list_block', async function (
  request: FastifyRequest<{Body: UserStateType;}>,
	 reply: FastifyReply) {
	const userId = request.body.id;
    if (!userId) {
      return reply.status(401).send({ success: false, errorMessage: `Not authenticated: ${userId}` });
    }

  try {
	const userDbInstance = new UserDb("/app/database/test.db");
	const userDb = userDbInstance.openDb();

	const blockedStmt = userDb.prepare(QueryFriend.LIST_OF_BLOCKED);
	const blocked = blockedStmt.all(userId) as { friend_id: number }[];
	const blockedIds = blocked.map((row) => row.friend_id);

	const usernameStmt = userDb.prepare(QueryUser.MATCH_EACH_ID_TO_USERNAME);

    const blockedStatuses: BlockedUser[] = blockedIds.map((id) => {
      const userRow = usernameStmt.get(id) as { username: string } | undefined;
	  if (!userRow?.username) return null;
      return {
        username: userRow.username,
      };
    })
	.filter(Boolean) as BlockedUser[];

	userDb.close();
    return reply.status(200).send({ success: true, blocked: blockedStatuses });
  } catch (error) {
    console.error("Friend list error:", error);
    return reply.status(500).send({ success: false, message: `Server error: ${userId}`});
  }
});
