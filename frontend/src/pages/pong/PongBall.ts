import { PongGamePaddle } from "./PongPaddle.js";
import { ThicknessPaddle, WWidth } from "./constants.js";
import { WHeight } from "./constants.js";
import { collorArray } from "./constants.js";

export class PongGameBall {
	private x: number;
	private y: number;
	private vx: number = Math.random() > 0.5 ? 4 : -4;
	private vy: number = Math.random() > 0.5 ? 4 : -4;
	private speed: number = 0.5;
	private size: number = 15;
	private lcollisionCount: number = 0;
	private rcollisionCount: number = 0;
	private lcollisionFlag: boolean = true;
	private rcollisionFlag: boolean = true;

	constructor(
		private c: CanvasRenderingContext2D,
		posX: number,
		posy: number,
		vX: number,
		vY: number,
		private color: string,
	) {
		this.x = posX;
		this.y = posy;
		this.vx = vX;
		this.vy = vY;
		this.color = collorArray[Math.floor(Math.random() * collorArray.length)];
	}
	getX():number{return this.x};
	getY():number{return this.y};
	setColor(color:string){
		this.color = color;
	}

	updatePos(lPaddle: PongGamePaddle, rPaddle: PongGamePaddle) {
		this.x += this.vx * this.speed;
		this.y += this.vy * this.speed;
		
		if (this.collisionCheck(lPaddle, rPaddle)) this.vx *= -1;
		
		else if (this.y < 0 || this.y > WHeight) this.vy *= -1;
		
		// else if (this.x < 0 && this.vx < 0 || this.x > WWidth && this.vx > 0 )
		else if (this.x < 0  || this.x > WWidth  )
		{
			// console.log("restart");
		}

	}
	collisionCheck(lPaddle: PongGamePaddle, rPaddle: PongGamePaddle): boolean{

		if(this.lcollisionFlag == false)
			console.log("this.lcollisionCount", this.lcollisionCount);
		this.lcollisionCount += 1;
		if(this.lcollisionCount == 20)
			this.lcollisionFlag = true;
		
		if(this.rcollisionFlag == false)
			console.log("this.rcollisionCount", this.rcollisionCount);
			this.rcollisionCount += 1;
		if(this.rcollisionCount == 20)
			this.rcollisionFlag = true;

		if(	this.getX() < lPaddle.getX() + lPaddle.getPaddleWidth() + ThicknessPaddle &&
			this.getY() < lPaddle.getY() + lPaddle.getPaddleHeight() &&
			this.getY() > lPaddle.getY()
			&& this.lcollisionFlag)
		{
			this.lcollisionFlag = false;
			this.lcollisionCount = 0;
			// this.speed += 0.1;
			this.setColor("#4F48F0")
			return true;
		}
		else if(this.getX() > rPaddle.getX() - rPaddle.getPaddleWidth() &&
		this.getY() < rPaddle.getY() + rPaddle.getPaddleHeight() &&
		this.getY() > rPaddle.getY()
		&& this.rcollisionFlag)
		{
			this.rcollisionFlag = false;
			this.rcollisionCount = 0;
			// this.speed += 0.1;
			this.setColor("#4Fs48F0")
			return true;
		}
		else
		{
			this.setColor("#BC48F0");
			return false;			
		} 
	}
	drawPos(){
		this.c.beginPath();

		// this.c.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
		// this.c.strokeStyle = "white";
		// this.c.stroke();

		this.c.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
		this.c.fillStyle = this.color;
		this.c.fill();
	}
	reset(CenterX: number, CenterY: number) {
		this.x = CenterX;
		this.y = CenterY;
		this.vx = Math.random() > 0.5 ? 4 : -4;
		this.vy = Math.random() > 0.5 ? 4 : -4;
		this.speed = 0.5;
	}
}