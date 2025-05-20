// import { ThicknessPaddle } from "./constants.js";
// import { WHeight } from "./constants.js";

interface PaddleParams {
	x: number;
	height: number
  }

export class PongGamePaddle {
/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
	private x: number;
	private y: number; 
	private height: number; 
  	private speed: number = 0.02;


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
	constructor({x, height}: PaddleParams) {
		this.x = x;
		this.y = 0.5;
		this.height = height;
	}

/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

	getX():number{return this.x};
	getY():number{return this.y};
	// getPaddleWidth():number{return this.paddleWidth};
	// getPaddleHeight():number{return this.paddleHeight};


	updatePos(paddleDown: boolean, paddleUp: boolean) {
		if (paddleDown) {
			// Check that the bottom of the paddle doesn't exceed 1.0
			if (this.y + this.height + this.speed <= 1) {
				console.log("down", this.y, "+", this.speed);
				this.y += this.speed;
			}
		}
		if (paddleUp) {
			// Check that the top stays above 0
			if (this.y - this.speed >= 0) {
				console.log("up", this.y,"-", this.speed);
				this.y -= this.speed;
			}
		}
	}
	
	reset() { this.y = 0.5; }
}