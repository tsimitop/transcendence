import { connectedUsers } from "../../websocket/WebSocket";
import { currentGames } from "./PongMsgHandler";
import { PongGame } from "./PongGame";
import { globalCountdown } from "./PongMsgHandler";
import { startGameLoop } from "./PongMsgHandlerGame";


type TournamentState = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';

type Player = {
	name: string;
	alias: string;
	socket: any;
};

export class Tournament {

/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/

  	private uniqueID: string;
	// private PlayerOneAlias: string = "PlayerOneAlias";
	// private PlayerOneName: string = "PlayerOneName";
	private currentPlayers: number = 0; 
	private gameState: TournamentState = "waiting";

	private players: Map<string, Player> = new Map();


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/

constructor(uniqueID: string, playerName: string, playerAlias: string ) {
	this.uniqueID = uniqueID;
	// this.PlayerOneName = playerName;
	// this.PlayerOneAlias = playerAlias;
	const socket = connectedUsers.get(playerName);

	this.addPlayer(playerName, playerAlias, socket);

  }


/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/
getPlayerOneAlias(): string | undefined {
	const firstEntry = this.players.entries().next().value;

	return firstEntry?.[0];
}



getAllPlayers(): Player[] {
	return Array.from(this.players.values());
}
  	addPlayer(name: string, alias: string, socket: any){
		// prevent duplicate - not necessary / possible?
		if(this.players.has(name))
			return;
		if (socket) {
			console.log("Socket exists for", name);
		}
		this.players.set(name, {name, alias, socket});
		this.currentPlayers++;
	}
  	removePlayer(name: string){
		if(this.players.has(name)){
			this.players.delete(name);
			this.currentPlayers--;
		}
	}


	getUniqeID(): string { return this.uniqueID; }
    getTournamentState(): TournamentState { return this.gameState; }
	getCurrentPlayers(): number { return this.currentPlayers; }

	readyToStart(): boolean{
		if(this.currentPlayers === 4)
			return true;
		else
			return false;
	}

	start() {
		let countdown = globalCountdown;

		console.log("Tournament is starting")
		const playerArray = Array.from(this.players.values());
		console.log(playerArray[0].name, "<->", playerArray[0].alias);
		console.log(playerArray[1].name, "<->", playerArray[1].alias);
		console.log(playerArray[2].name, "<->", playerArray[2].alias);
		console.log(playerArray[3].name, "<->", playerArray[3].alias);

		// create match one
		const uniqueGameIDOne = `${playerArray[0].name}-Game-${Date.now()}`;
		const matchOne = new PongGame(uniqueGameIDOne, playerArray[0].name, playerArray[0].alias, "remote");
			// set it to gameslist
			currentGames.set(playerArray[0].name, matchOne);
			// add state and opponent
			matchOne.setGameState('countdown');
			matchOne.setOpponentName(playerArray[1].name, playerArray[1].alias);


		// create match two
		const uniqueGameIDTwo = `${playerArray[2].name}-Game-${Date.now()}`;
		const matchTwo = new PongGame(uniqueGameIDTwo, playerArray[2].name, playerArray[2].alias, "remote");
		// 	// set it to gameslist
			currentGames.set(playerArray[2].name, matchTwo);

		// 	// add opponent
			matchTwo.setOpponentName(playerArray[3].name, playerArray[3].alias);
			matchTwo.setGameState('countdown');

		const response = {
				target_endpoint: 'pong-api',
				type: 'countdown',
				value : countdown
		  };
	
		  if (!playerArray[0].socket || playerArray[0].socket.readyState !== WebSocket.OPEN) return;
		  if (!playerArray[1].socket || playerArray[1].socket.readyState !== WebSocket.OPEN) return;
		  if (!playerArray[2].socket || playerArray[2].socket.readyState !== WebSocket.OPEN) return;
		  if (!playerArray[3].socket || playerArray[3].socket.readyState !== WebSocket.OPEN) return;

		  playerArray[0].socket.send(JSON.stringify(response));
		  playerArray[1].socket.send(JSON.stringify(response));
		  playerArray[2].socket.send(JSON.stringify(response));
		  playerArray[3].socket.send(JSON.stringify(response));

  		// set sockets to current instance
		  matchOne.setSockets(playerArray[0].socket, playerArray[1].socket);
		  matchTwo.setSockets(playerArray[2].socket, playerArray[3].socket);
		  
		//   doesnt work i dont know why instead upper line works
		//   currentGames.get(playerArray[1].name)?.setSockets(playerArray[0].socket, playerArray[1].socket);
		//   currentGames.get(playerArray[3].name)?.setSockets(playerArray[2].socket, playerArray[3].socket);

			const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
			clearInterval(interval);
			for (const [username, game] of currentGames.entries()) {
				if(uniqueGameIDOne === game.getUniqeID()){
					game.setGameState('playing');
				}
				if(uniqueGameIDTwo === game.getUniqeID()){
				game.setGameState('playing');
				}
			}
			startGameLoop(currentGames.get(playerArray[0].name)!);
			startGameLoop(currentGames.get(playerArray[2].name)!);

			setTimeout(() => {
			}, 1000);
			} 
		}, 1000);



	}
}