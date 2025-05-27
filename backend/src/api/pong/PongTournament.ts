
type TournamentState = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';


export class Tournament {

/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/

  	private uniqueID: string;
	private PlayerOneAlias: string = "PlayerOneAlias";
	private PlayerOneName: string = "PlayerOneName";
	private currentPlayers: number = 1; 
	private gameState: TournamentState = "waiting";



/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/

constructor(uniqueID: string, PlayerOneName: string, PlayerOneAlias: string ) {
	this.uniqueID = uniqueID;
	this.PlayerOneAlias = PlayerOneAlias;
	this.PlayerOneName = PlayerOneName;
  }


/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/
	getUniqeID(): string { return this.uniqueID; }
    getlPlayerAlias(): string{ return this.PlayerOneAlias; }
    getTournamentState(): TournamentState { return this.gameState; }
	getCurrentPlayers(): number { return this.currentPlayers; }

	playerJoined() {
		this.currentPlayers++;
	}

	readyToStart(): boolean{
		if(this.currentPlayers === 4)
			return true;
		else
			return false;
	}

	start() {

	}
}