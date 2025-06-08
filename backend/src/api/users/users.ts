import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { QueryUser } from "../../user-database/queries";
import { QueryFriend } from "../../user-database/friend-queries";
import UserDb from "../../user-database/UserDb";
import { connectedUsers } from '../../websocket/WebSocket';
import { UserStateType } from "../sign-in/sign-in";
import { fastify } from "../../server";

type SearchRequestBody = {
  userState: UserStateType;
  searchTerm: string;
  isUserConnected: boolean | undefined;
};

fastify.post("/api/users", async function (request: FastifyRequest<{ Body: SearchRequestBody }>, reply: FastifyReply) {
  try {
   const { searchTerm } = request.body;
   const username = searchTerm?.trim();
   if (!username) {
     return reply.status(400).send({ error: "Invalid input: search term is required." });
  }
    const userDbInstance = new UserDb("/app/database/test.db");
	let userDb;
	userDb = userDbInstance.openDb();
	const getUserIdStatement = userDb.prepare(QueryUser.FIND_ID_USERNAME_EMAIL_AVATAR);
	const result = getUserIdStatement.get(username) as { id: number, username: string, email: string, avatar: string } | undefined;
	const currentUserId = request.body.userState.id;
	const getFriendStatus = userDb.prepare(QueryFriend.GET_FRIENDSHIP_STATUS);

    if (!result) {
	  userDb.close();
      return reply.status(404).send({
		error: "User " + username + " not found in database."
	});
    }
	const current_to_taget_result = getFriendStatus.get(currentUserId, result.id) as { status: string } | undefined;
	const extractedStatus = current_to_taget_result?.status;
	userDb.close();
	let connectionStatus;
	if (request.body.isUserConnected) {
	  connectionStatus = "Online 🟢";
	}
	else {
	  connectionStatus = "Offline ⚫";
	}
    return reply.status(200).send({
	  user: {
	    id: result.id,
	    email: result.email,
	    username: result.username,
	    is_friend: extractedStatus === "accepted",
	    onlineStatus: connectionStatus,
	    // avatar: "default.png",
	    avatar: result.avatar,
	  }
	});
  } catch 
  (err: any) {
    return reply.status(500).send({ error: "Server error: " + err });
  }  
});

  fastify.get("/api/users", async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const connectedUsernames = Array.from(connectedUsers.keys());
      return reply.status(200).send({ connectedUsersArray: connectedUsernames });
    } catch (err: any) {
      return reply.status(500).send({ error: "Failed to retrieve connected users", detail: err.message });
    }
});
