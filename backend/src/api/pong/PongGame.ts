import { PongGameBall } from "./PongBall";
import { PongGamePaddle } from "./PongPaddle";

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




/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



constructor(uniqueID: string) {
  this.uniqueID = uniqueID;

    }



/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

    getUniqeID() : string { return this.uniqueID; }
    getGameState() : GameState { return this.gameState; }






}