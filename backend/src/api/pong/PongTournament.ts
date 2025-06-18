import { connectedUsers, getPongSocket } from "../../websocket/WebSocket";
import { currentGames, currentTournaments } from "./PongMsgHandler";
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
	public static readonly MAX_PLAYERS: number = 4; // Maximum players in a tournament

	private players: Map<string, Player> = new Map();
	private matchWinners: Player[] = [];
	private finalStarted: boolean = false;

/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/

	constructor(uniqueID: string, playerName: string, playerAlias: string ) {
		this.uniqueID = uniqueID;
		// this.PlayerOneName = playerName;
		// this.PlayerOneAlias = playerAlias;
		const socket = getPongSocket(playerName);
		this.addPlayer(playerName, playerAlias, socket);
		this.broadcastTournamentCreated();
	}

/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

	getUniqeID(): string { return this.uniqueID; }
	getTournamentState(): TournamentState { return this.gameState; }
	getCurrentPlayers(): number { return this.currentPlayers; }

	getPlayerOneAlias(): string | undefined {
		const firstEntry = this.players.entries().next().value;
		return firstEntry?.[0];
	}

	getAllPlayers(): Player[] {
		return Array.from(this.players.values());
	}

	hasPlayer(playerName: string): boolean {
		return this.players.has(playerName);
	}

	playerCanJoin(playerName: string, alias: string): boolean {
		if (this.getTournamentState() !== 'waiting') {
			console.warn("Tournament is not in waiting state, cannot join");
			return false;
		}
		if (this.currentPlayers >= Tournament.MAX_PLAYERS) {
			console.warn("Tournament is full, cannot join");
			return false;
		}
		if (this.players.has(playerName)) {
			console.warn(`Player with name ${playerName} already in tournament`);
			return false;
		}
		for (const player of this.players.values()) {
			if (player.alias === alias) {
				console.warn(`Alias ${alias} is already used in tournament`);
				return false;
			}
		}
		return true;
	}

	addPlayer(name: string, alias: string, socket: any) {
		if (!this.playerCanJoin(name, alias)) {
			console.debug(`Player ${name} with alias ${alias} cannot join tournament`);
			return;
		}

		this.players.set(name, { name, alias, socket });
		this.currentPlayers++;
	}

	removePlayer(name: string) {
		if (this.players.has(name)) {
			this.players.delete(name);
			this.currentPlayers--;
		}
	}

	readyToStart(): boolean{
		return this.currentPlayers === 4;
	}

	start(): void {
		let countdown = globalCountdown;
		console.log("Tournament is starting");

		const playerArray = Array.from(this.players.values());

		const matchOne = new PongGame(`${playerArray[0].name}-Game-${Date.now()}`, playerArray[0].name, playerArray[0].alias, "remote");
		matchOne.setOpponentName(playerArray[1].name, playerArray[1].alias);
		matchOne.setGameState('countdown');
		matchOne.setSockets(playerArray[0].socket, playerArray[1].socket);
		// Store game under both players' names so both can access it
		currentGames.set(playerArray[0].name, matchOne);
		currentGames.set(playerArray[1].name, matchOne);

		const matchTwo = new PongGame(`${playerArray[2].name}-Game-${Date.now()}`,
		  playerArray[2].name, playerArray[2].alias, "remote");
		matchTwo.setOpponentName(playerArray[3].name, playerArray[3].alias);
		matchTwo.setGameState('countdown');
		matchTwo.setSockets(playerArray[2].socket, playerArray[3].socket);
		// Store game under both players' names so both can access it
		currentGames.set(playerArray[2].name, matchTwo);
		currentGames.set(playerArray[3].name, matchTwo);

		const response = {
			target_endpoint: 'pong-api',
			type: 'countdown',
			value : countdown
		};

		playerArray.forEach(p => {
			if (p.socket?.readyState === WebSocket.OPEN) {
				p.socket.send(JSON.stringify(response));
			}
		});

		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				matchOne.setGameState('playing');
				matchTwo.setGameState('playing');
				startGameLoop(matchOne);
				startGameLoop(matchTwo);
			}
		}, 1000);
	}

	public notifyMatchEnd(winnerName: string): void {
		console.log(`notifyMatchEnd called with: ${winnerName}`);
		console.log("Final started:", this.finalStarted);
		console.log("Current matchWinners:", this.matchWinners.map(p => p.alias));

		const winner = this.players.get(winnerName);
		if (!winner) {
			console.warn("Winner not found in tournament players.");
			return;
		}

		if (this.finalStarted) {
			console.log(`Final match ended. ${winner.alias} wins the tournament.`);
			this.finishTournament(winnerName);
			return;
		}

		this.matchWinners.push(winner);
		console.log(`Tournament: ${winner.alias} won a match.`);

		if (this.matchWinners.length === 2) {
			this.startFinal();
		}
	}


	private startFinal(): void {
		console.log("Starting final round of tournament");

		const [winner1, winner2] = this.matchWinners;

		const finalGameId = `${winner1.name}-Final-${Date.now()}`;
		const finalGame = new PongGame(finalGameId, winner1.name, winner1.alias, "remote");
		finalGame.setOpponentName(winner2.name, winner2.alias);
		finalGame.setGameState("countdown");
		finalGame.setSockets(winner1.socket, winner2.socket);
		// Store final game under both players' names so both can access it
		currentGames.set(winner1.name, finalGame);
		currentGames.set(winner2.name, finalGame);

		this.finalStarted = true;
		let countdown = globalCountdown;
		const response = {
			target_endpoint: 'pong-api',
			type: 'countdown',
			value: countdown
		};

		winner1.socket.send(JSON.stringify(response));
		winner2.socket.send(JSON.stringify(response));

		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				finalGame.setGameState("playing");
				startGameLoop(finalGame);
			}
		}, 1000);
	}

	private finishTournament(winnerName: string): void {
		const winnerAlias = this.players.get(winnerName)?.alias ?? winnerName;

		for (const player of this.players.values()) {
			if (player.socket?.readyState === WebSocket.OPEN) {
				player.socket.send(JSON.stringify({
					target_endpoint: 'pong-api',
					type: 'tournament_end',
					value: `${winnerAlias} has won the tournament!`
				}));
			}
		}

		currentTournaments.delete(this.uniqueID);
		console.log(`Tournament ${this.uniqueID} is finished and removed.`);
	}

	private broadcastTournamentCreated(): void {
		const message = "A new Pong tournament starts! Join now!";

		for (const connections of connectedUsers.values()) {
			const chatSocket = connections.get("chat")?.socket;

			if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
				chatSocket.send(JSON.stringify({
					type: "TOURNAMENT_NOTIFICATION",
					message,
				}));
			}
		}
	}
}
