import {  FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { QueryFriend } from "../../user-database/friend-queries";
import UserDb from "../../user-database/UserDb";
import { UserStateType } from "../sign-in/sign-in";

const STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  DEFAULT: 'default'
};

interface FriendRequestBody {
  user: UserStateType;
  userIdBtn: number;
}

interface FriendshipStatus {
  status: string;
}

export default async function friendsRoutes(fastify: FastifyInstance) {
fastify.post('/api/friends', async function (
	request: FastifyRequest<{Body: FriendRequestBody}>,
	 reply: FastifyReply) {

	const user = request.body.user;
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
	if (current_to_taget_result.status !== "blocked") {
		if (taget_to_current_result?.status === "pending"){
			const bidirectional_friendship = userDb.prepare(QueryFriend.SET_BIDIRECTIONAL_STATUS);
			bidirectional_friendship.run(STATUS.ACCEPTED, currentUserId, targetUser, targetUser, currentUserId);
		}
		else if (["default", "rejected"].includes(current_to_taget_result.status)) { //same as checking stat1 === def || stat.2 === rej
			const pending_friendship = userDb.prepare(QueryFriend.SET_ONEDIRECTIONAL_STATUS);
			pending_friendship.run(STATUS.PENDING, currentUserId, targetUser);
		}
	}
	userDb.close();
    return reply.status(200).send({ success: true });
  } catch (error) {
    console.error("Friend request error:", error);
    return reply.status(500).send({ success: false, message: "Server error"});
  }
});
}

//_________________________TEST_____________________

	 //---------------------------------------------
	//  return reply.status(505).send({
	// 	message: "targetUser: " + targetUser +
	// 	" | currentUserId: " + currentUserId +
	// 	" | USER: " + user,
	// 	success: true });
	 //---------------------------------------------
