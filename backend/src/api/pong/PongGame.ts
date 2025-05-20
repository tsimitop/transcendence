import { PongGameBall } from "./PongBall";
import { PongGamePaddle } from "./PongPaddle";
import { GameStateData } from "./PongMessages";

type GameState = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';


export class PongGame {


/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
  private uniqueID: string;
  private backendBall: PongGameBall;

  public lPlayerPaddle: PongGamePaddle;
  private rPlayerPaddle: PongGamePaddle;
  private gameState: GameState = "waiting";
  private lPlayerAlias: string = "Player1";
  private rPlayerAlias: string = "Player2";
  private lPlayerName: string = "Player1";
  private rPlayerName: string = "Player2";
  private lPlayerScore: number = 0;
  private rPlayerScore: number = 0;
  

  private lPlayerSocket: any;
  private rPlayerSocket: any;

  private gameStateData: GameStateData = {
    game: {
      id: "",
      status: "playing",
      ball: {
        x: 0.5,
        y: 0.5
      },
      leftPaddle: {
        topPoint: {
          x: 0.05,
          y: 0.4,
        },
        height: 0.2
      },
      rightPaddle: {
        topPoint: {
          x: 0.95,
          y: 0.4
        },
        height: 0.2
      },
      lastUpdateTime: Date.now(),
      gameMode: "string",
      maxScore: 5,
      scores: {},
      countdown: 0
    }
  };
  


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



constructor(uniqueID: string, lPlayerName: string, lPlayerAlias: string ) {
  this.uniqueID = uniqueID;
  this.lPlayerName = lPlayerName;
  this.lPlayerAlias = lPlayerAlias;
  this.backendBall = new PongGameBall({ x: 0.5, y: 0.5, radius: 0.01 });

  this.lPlayerPaddle = new PongGamePaddle({x: 0.5, height: 0.2});
  this.rPlayerPaddle = new PongGamePaddle({x: 0.5, height: 0.2});

  }



/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

    getUniqeID() : string { return this.uniqueID; }
    getGameState() : GameState { return this.gameState; }

    getlPlayerScore() : number { return this.lPlayerScore }
    getrPlayerScore() : number { return this.rPlayerScore }

  
    setSockets(lPlayerSocket: any, rPlayerSocket: any){
      this.lPlayerSocket = lPlayerSocket;
      this.rPlayerSocket = rPlayerSocket;
    }
    getlPlayerSocket(): any{ return this.lPlayerSocket; }
    getrPlayerSocket(): any{ return this.rPlayerSocket; }
    getlPlayerName(): string{ return this.lPlayerName; }
    getrPlayerName(): string{ return this.rPlayerName; }

    setOpponentName(opponentName: string, opponentAlias: string){
      this.rPlayerName = opponentName;
      this.rPlayerAlias = opponentAlias;
      console.log( this.rPlayerName, "-> " ,this.rPlayerAlias);
      console.log( this.lPlayerName, "-> " ,this.lPlayerAlias);
    }


    setGameState(state : GameState) : void { 
      this.gameState = state;
      // console.log( this.getUniqeID(), "new GameState:", this.gameState);
    }

    update(){
      if(this.gameState === "finished")
        return;

      this.gameStateData.game.leftPaddle.topPoint.y = this.lPlayerPaddle.getY();
      this.gameStateData.game.rightPaddle.topPoint.y = this.rPlayerPaddle.getY();

      this.gameStateData.game.ball.x += this.backendBall.getVx() * this.backendBall.getSpeed();
      this.gameStateData.game.ball.y += this.backendBall.getVy() * this.backendBall.getSpeed();

      // console.log(this.backendBall.getVx(), " ", this.backendBall.getVy())

      
      
      // Bounce off top and bottom
      if (this.gameStateData.game.ball.y - (this.backendBall.getRadius() * 2) < 0){
        // console.log("y < 0");
        // console.log(this.gameStateData.game.ball.y)
        this.backendBall.setVy(-1);
      }
      
      if(this.gameStateData.game.ball.y + (this.backendBall.getRadius() * 2) > 1) {
        // console.log("y > 1");
        // console.log(this.gameStateData.game.ball.y + this.backendBall.getRadius());
        this.backendBall.setVy(-1);
      }
      
      // Bounce off left and right (basic handling, later you can add scoring here)
      if (this.gameStateData.game.ball.x - this.backendBall.getRadius() < 0)
        {
      // console.log("x < 0");
      this.backendBall.setVx(-1);
    } 
    if(this.gameStateData.game.ball.x + this.backendBall.getRadius() > 1) {
        // console.log("x > 1");
      this.backendBall.setVx(-1);

    }
    // console.log('vx:', this.backendBall.getVx(), 'vy:', this.backendBall.getVy());
    // console.log('vx:', this.gameStateData.game.ball.x, 'vy:', this.gameStateData.game.ball.y);


    }


    getGameStatePayload(): GameStateData { return this.gameStateData; }



}