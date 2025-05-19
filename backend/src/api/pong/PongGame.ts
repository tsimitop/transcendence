import { PongGameBall } from "./PongBall";
// import { PongGamePaddle } from "./PongPaddle";

type GameState = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';


export class PongGame {


/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
  private uniqueID: string;
  // private backendBall: PongGameBall;
  // private lPlayerPaddle: PongGamePaddle;
  // private rPlayerPaddle: PongGamePaddle;
  private gameState: GameState = "waiting";
  private lPlayerAlias: string = "Player1";
  private rPlayerAlias: string = "Player2";
  private lPlayerName: string = "Player1";
  private rPlayerName: string = "Player2";
  
  private lPlayerSocket: any;
  private rPlayerSocket: any;



/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



constructor(uniqueID: string, lPlayerName: string, lPlayerAlias: string ) {
  this.uniqueID = uniqueID;
  this.lPlayerName = lPlayerName;
  this.lPlayerAlias = lPlayerAlias;

  }



/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

    getUniqeID() : string { return this.uniqueID; }
    getGameState() : GameState { return this.gameState; }
    getPlayers(){
      const players = [];
      if (this.lPlayerName) players.push(this.lPlayerName);
      if (this.rPlayerName) players.push(this.rPlayerName);
      return players;
    }
    setSockets(lPlayerSocket: any, rPlayerSocket: any){
      this.lPlayerSocket = lPlayerSocket;
      this.rPlayerSocket = rPlayerSocket;
    }
    getlPlayerSocket(): any{ return this.lPlayerSocket; }
    getrPlayerSocket(): any{ return this.rPlayerSocket; }

    setOpponentName(opponentName: string, opponentAlias: string){
      this.rPlayerName = opponentName;
      this.rPlayerAlias = opponentAlias;
      console.log( this.rPlayerName, "-> " ,this.rPlayerAlias);
      console.log( this.lPlayerName, "-> " ,this.lPlayerAlias);
    }


    setGameState(state : GameState) : void { 
      this.gameState = state;
      console.log( this.getUniqeID(), "new GameState:", this.gameState);
    }

    update(){
      // do calculation
    }


    getGameStatePayload(){

    }



}