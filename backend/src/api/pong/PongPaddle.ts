import { ThicknessPaddle } from "./constants.js";
import { WHeight } from "./constants.js";



export class PongGamePaddle {
	private x: number;
	private y: number; 
  	private speed: number = 10;

	private paddleWidth: number = ThicknessPaddle;
	private paddleHeight: number = 150;

	constructor(
		private c: CanvasRenderingContext2D,
		posX: number,
		posy: number
	) {
		this.x = posX;
		this.y = posy - this.paddleHeight/2;

	}
	getX():number{return this.x};
	getY():number{return this.y};
	getPaddleWidth():number{return this.paddleWidth};
	getPaddleHeight():number{return this.paddleHeight};
	updatePos(paddleDown: boolean, paddleUp: boolean) {
	if (this.y + this.speed < WHeight - this.paddleHeight )
	{
		if(paddleDown == true) 
			this.y += this.speed;
	}
	if (this.y + this.speed > 20 )
	{
		if(paddleUp == true) 
			this.y -=  this.speed;
	}
	}
	
	drawPos(){
		this.c.fillStyle = 'rgb(242, 159, 6)';
		this.c.fillRect(this.x,this.y, this.paddleWidth,this.paddleHeight)	
	}
	reset(CenterY: number) {
		this.y = CenterY - this.paddleHeight / 2  ;

	}
}