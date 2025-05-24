import { PongGameBall } from "./PongBall";
import { PongGamePaddle } from "./PongPaddle";
import { GameStateData } from "./PongMessages";
import { endOfGame } from "./PongMsgHandler";

type GameState = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';


export class PongGame {


/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
  private uniqueID: string;
  public ball: PongGameBall;

  public lPaddle: PongGamePaddle;
  public rPaddle: PongGamePaddle;

  
  private gameState: GameState = "waiting";
  private lPlayerAlias: string = "Player1";
  private rPlayerAlias: string = "Player2";
  private lPlayerName: string = "Player1";
  private rPlayerName: string = "Player2";
  private lPlayerScore: number = 0;
  private rPlayerScore: number = 0;

  private maxScore: number = 1;

  public gameMode: string = "local";




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
          y: 0.5,
        },
        height: 0.2
      },
      rightPaddle: {
        topPoint: {
          x: 0.95,
          y: 0.5
        },
        height: 0.2
      },
      lastUpdateTime: Date.now(),
      gameMode: this.gameMode,
      maxScore: 5, // always 5 ???
      scores: {},
      countdown: 0 // not implemented
    }
  };
  


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



constructor(uniqueID: string, lPlayerName: string, lPlayerAlias: string, gameMode: string ) {
  this.uniqueID = uniqueID;
  this.lPlayerName = lPlayerName;
  this.lPlayerAlias = lPlayerAlias;
  this.ball = new PongGameBall({ x: 0.5, y: 0.5, radius: 0.01 });

  this.lPaddle = new PongGamePaddle({x: 0.1, height: 0.2, width: 0.01});
  this.rPaddle = new PongGamePaddle({x: 0.99, height: 0.2, width: 0.01});
  this.gameMode = gameMode;

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
    getlPlayerAlias(): string{ return this.lPlayerAlias; }
    getrPlayerAlias(): string{ return this.rPlayerAlias; }

    setOpponentName(opponentName: string, opponentAlias: string){
      this.rPlayerName = opponentName;
      this.rPlayerAlias = opponentAlias;
    }
    setGameState(state : GameState) : void { 
      this.gameState = state;
      // console.log( this.getUniqeID(), "new GameState:", this.gameState);
    }


    updateGameStatData(){

      this.gameStateData.game.leftPaddle.topPoint.y = this.lPaddle.getY();
      this.gameStateData.game.rightPaddle.topPoint.y = this.rPaddle.getY();

      this.gameStateData.game.ball.x = this.ball.getX();
      this.gameStateData.game.ball.y = this.ball.getY();

    }

    checkCollisionWithPaddle(): boolean {
      // left Paddle
      if(this.lPaddle.collisionCheckIsActivated()){
        if (this.ball.getY() < this.lPaddle.getY() + this.lPaddle.getHeight() &&
        this.ball.getY() > this.lPaddle.getY() &&
        this.ball.getX() < this.lPaddle.getWidth()
      ){
        this.lPaddle.collisionFlag = false;
        this.rPaddle.collisionFlag = false;
        return true;
      }

    }
    // right Paddle
    if(this.rPaddle.collisionCheckIsActivated()){
      if (this.ball.getY() > this.rPaddle.getY() &&
      this.ball.getY() < this.rPaddle.getY() + this.rPaddle.getHeight() &&
      this.ball.getX() > this.rPaddle.getX()
    ){
      this.lPaddle.collisionFlag = false;
      this.rPaddle.collisionFlag = false;
      return true;
    }

    }
      return false;
    }    

    outOfFieldCheck(): boolean{
      if(this.ball.getVx() < 0 && this.ball.getX() < this.lPaddle.getWidth()){
        this.rPlayerScore++;
        return true; 
      }   
      if(this.ball.getVx() > 0 && this.ball.getX() > 1 - this.lPaddle.getWidth()){
        this.lPlayerScore++;
        return true;
      }
      return false;
    }

    setToRestart(){
      if(this.gameState === "finished") return;
      this.lPaddle.reset();
      this.rPaddle.reset();
      this.ball.reset();

    }

    checkEndOfGame(){
      if(this.lPlayerScore >= this.maxScore){
        this.gameState = "finished";
        console.log("checkEndOfGame");
        endOfGame(this.lPlayerName, "Left Player WIN")
      }
      else if(this.rPlayerScore >= this.maxScore){
        this.gameState = "finished";
        console.log("checkEndOfGame");
        endOfGame(this.rPlayerName, "Right Player WIN")
      }
    }

    update(){
      if(this.gameState === "finished") return;
      
      //update ball posistion
      this.ball.setX(this.ball.getVx() * this.ball.getSpeed());
      this.ball.setY(this.ball.getVy() * this.ball.getSpeed());
      
      // Bounce off top and bottom
      if (this.ball.getY() - (this.ball.getRadius() * 2) < 0){ this.ball.setVy(-1); }
      else if(this.ball.getY() + (this.ball.getRadius() * 2) > 1) { this.ball.setVy(-1); }
      
      // console.log(this.ball.getSpeed())
      if(this.checkCollisionWithPaddle()) { 
        this.ball.setVx(-1);
        this.ball.setSpeed(0.3) }

        if(this.outOfFieldCheck()){ this.setToRestart(); }

        this.updateGameStatData();
        this.checkEndOfGame();
    }
    getGameStatePayload(): GameStateData { return this.gameStateData; }

}