import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fastify } from "../../server";
import { QueryUser } from "../../user-database/queries";
import UserDb from "../../user-database/UserDb";
import path from "path";

type SearchRequestBody = {
  searchTerm: string;
};

//--------------------CORRECT-------------------------
export default async function usersRoutes(fastify: FastifyInstance) {
fastify.post("/api/users", async (request: FastifyRequest<{ Body: SearchRequestBody }>, reply: FastifyReply) => {

//   let i = 0;// for debugging
  try {
   const { searchTerm } = request.body;
   const username = searchTerm?.trim();
   if (!username) {
     return reply.status(400).send({ error: "Invalid input: search term is required." });
  }
    const userDbInstance = new UserDb("/app/database/test.db");
	let userDb;
	// try{
	userDb = userDbInstance.openDb();
	// }
	// catch (dbOpenErr: any){
	//   console.error("Failed to open DB:", dbOpenErr);
	//   return reply.status(500).send({ error: "DB open failed", detail: dbOpenErr.message });
	// }
	const getUserIdStatement = userDb.prepare(QueryUser.FIND_ID_USERNAME_EMAIL);
	const result = getUserIdStatement.get(username) as { id: number, username: string, email: string } | undefined;
	userDb.close();
    if (!result) {
      return reply.status(404).send({
		error: "User " + username + " not found in database."
	});
    }
    return reply.status(200).send({
		user: {
			username: result.username,
			email: result.email
		}
	});
  } catch 
  (err: any) {
    // return reply.status(500).send({ error: "Server error: " + i }); // for debugging
    return reply.status(500).send({ error: "Server error" + err });
  }  
});
}

//-----------------MOCK TEST-------------------------

// export default async function usersRoutes(fastify: FastifyInstance) {
//   fastify.post(
//     "/api/users",
//     async (
//       request: FastifyRequest<{ Body: SearchRequestBody }>,
//       reply: FastifyReply
//     ) => {
//     //   console.log("Received search request:", request.body.searchTerm);
//       return reply.status(200).send({
//         username: "USER FROM API.",
//         email: "email@fromapi.test", // Consider changing this domain for professionalism
//       });
//     }
//   );
// }
