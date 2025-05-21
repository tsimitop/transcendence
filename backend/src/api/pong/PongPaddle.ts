// import { ThicknessPaddle } from "./constants.js";
// import { WHeight } from "./constants.js";

interface PaddleParams {
	x: number;
	height: number
	width: number
  }

export class PongGamePaddle {
/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
	private x: number;
	private y: number; 
	private height: number; 
	private width: number; 
  	private speed: number = 0.01;

	  public collisionCount: number = 0;
	  public collisionFlag: boolean = true;

/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
	constructor({x, height, width}: PaddleParams) {
		this.x = x;
		this.y = 0.5;
		this.height = height;
		this.width = width;
	}

/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

	getX():number{return this.x};
	getY():number{return this.y};
	getHeight():number{return this.height};
	getWidth():number{return this.width};
	// getPaddleWidth():number{return this.paddleWidth};
	// getPaddleHeight():number{return this.paddleHeight};

	updatePos(paddleDown: boolean, paddleUp: boolean) {
		if (paddleDown) {
			if (this.y + this.height + this.speed <= 1) {
				this.y += this.speed;
			}
		}
		if (paddleUp) {
			if (this.y - this.speed >= 0) {
				this.y -= this.speed;
			}
		}
	}
	
	collisionCheckIsActivated(): boolean {
		if (!this.collisionFlag) {
		  this.collisionCount++;
		  if (this.collisionCount >= 20) {
			this.collisionCount = 0;
			this.collisionFlag = true;
		  }
		}
		return this.collisionFlag;
	  }
	  


	reset() { this.y = 0.5; }
}