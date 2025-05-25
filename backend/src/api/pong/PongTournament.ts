


export class Tournament {

/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/

  	private uniqueID: string;
	private PlayerOneAlias: string = "PlayerOneAlias";
	private PlayerOneName: string = "PlayerOneName";
	private currentPlayers: number = 1; 



/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
constructor(uniqueID: string, PlayerOneAlias: string, PlayerOneName: string ) {
	this.uniqueID = uniqueID;
	this.PlayerOneAlias = PlayerOneAlias;
	this.PlayerOneName = PlayerOneName;
  }


/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

	increaseCurrentPlayers() {
		this.currentPlayers++;
	}

	readyCheck(): boolean{
		if(this.currentPlayers === 4)
			return true;
		else
			return false;
	}

	start() {

	}
}