// import { PongGameBall } from "./PongBall";
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
  private lPlayerName: string = "Player1";
  private rPlayerName: string = "Player2";




/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



constructor(uniqueID: string, lPlayerName: string, rPlayerName: string ) {
  this.uniqueID = uniqueID;
  this.lPlayerName = lPlayerName;
  this.rPlayerName = rPlayerName;


  }



/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

    getUniqeID() : string { return this.uniqueID; }
    getGameState() : GameState { return this.gameState; }






}