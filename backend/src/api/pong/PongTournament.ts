
type TournamentState = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';

type Player = {
	name: string;
	alias: string;
};

export class Tournament {

/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/

  	private uniqueID: string;
	private PlayerOneAlias: string = "PlayerOneAlias";
	private PlayerOneName: string = "PlayerOneName";
	private currentPlayers: number = 0; 
	private gameState: TournamentState = "waiting";

	private players: Map<string, Player> = new Map();


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/

constructor(uniqueID: string, playerName: string, playerAlias: string ) {
	this.uniqueID = uniqueID;
	this.PlayerOneName = playerName;
	this.PlayerOneAlias = playerAlias;

	this.addPlayer(playerName, playerAlias);

  }


/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/
getAllPlayers(): Player[] {
	return Array.from(this.players.values());
}
  	addPlayer(name: string, alias: string){
		// prevent duplicate - not necessary / possible?
		if(this.players.has(name))
			return;
		this.players.set(name, {name, alias});
		this.currentPlayers++;
	}
  	removePlayer(name: string){
		if(this.players.has(name)){
			this.players.delete(name);
			this.currentPlayers--;
		}
	}


	getUniqeID(): string { return this.uniqueID; }
    getlPlayerAlias(): string{ return this.PlayerOneAlias; }
    getTournamentState(): TournamentState { return this.gameState; }
	getCurrentPlayers(): number { return this.currentPlayers; }

	readyToStart(): boolean{
		if(this.currentPlayers === 4)
			return true;
		else
			return false;
	}

	start() {

	}
}