const WWidth:number = 1200;
const WHeight:number = 800;

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (canvas) {
    const game = new PongGame(canvas);
    game.start();
  } else {
    console.error("Canvas not found!");
  }
});


/**************************************************************************/
/**************		INPUT FROM KEYBOARD			***************************/
/**************************************************************************/

const keys = new Set<string>();

window.addEventListener("keydown", (event) => {
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});



/**************************************************************************/

// window.addEventListener('resize', function(){
// 	const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
// 	canvas.width = this.window.innerWidth;
// 	canvas.height = this.window.innerHeight;
// })




type Mouse = {
	x: number,
	y: number
}

let m: Mouse = { x: 0, y: 0 };
let maxRadius = 40;
let minRadius = 10;
let collorArray = [
	'#4F48F0',
	'#BC48F0',
	'#8447F0',
	'#4877F0',
	'#F048E9',
]

// function getDistance(x1: number, y1: number, x2: number, y2: number): number{
// 	let xDistance = x2 - x1;
// 	let yDistance = y2 - y1;

// 	return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2))
// }



class PongGameBall {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private speed: number = 1;
	// private size: number = 20;
	private size: number = Math.floor(Math.random() * 3);

	constructor(
		private c: CanvasRenderingContext2D,
		private posX: number,
		private posy: number,
		private vX: number,
		private vY: number,
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
		
		if (this.collisionCheck(lPaddle, rPaddle))this.vx *= -1;

		else if (this.y < 0 || this.y > WHeight) this.vy *= -1;

		else if (this.x < 0 && this.vx < 0 || this.x > WWidth && this.vx > 0 )
		{
			// console.log("restart");
		}


		
		this.resizing();
	}
	collisionCheck(lPaddle: PongGamePaddle, rPaddle: PongGamePaddle): boolean{

		if(this.getX() < lPaddle.getX() + lPaddle.getPaddleWidth() &&
			this.getY() < lPaddle.getY() + lPaddle.getPaddleHeight() &&
			this.getY() > lPaddle.getY())
		{
			// console.log(lPaddleDist, rPaddleDist)
			this.setColor("#4F48F0")
			return true;
		}
		else if(this.getX() > rPaddle.getX() - rPaddle.getPaddleWidth() &&
		this.getY() > rPaddle.getY() &&
		this.getY() < rPaddle.getY() + rPaddle.getPaddleHeight())
		{
			// console.log(lPaddleDist, rPaddleDist)
			this.setColor("#4F48F0")
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

	resizing()
	{
		const hoverDist = 100;
		const maxSize = 60;
		const minSize = 10;

		const dx = m.x - this.x;
		const dy = m.y - this.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		if (distance < hoverDist && this.size < maxSize) {
			if(this.size < maxRadius)
				this.size += 10;
		} else if (this.size > minSize) {
			if(this.size > minRadius)
				this.size -= 10;
		}
	}
}


class PongGamePaddle {
	private x: number;
	private y: number; 
  	private speed: number = 10;

	private paddleWidth: number = 10;
	private paddleHeight: number = 150;

	constructor(
		private c: CanvasRenderingContext2D,
		private posX: number,
		private posy: number
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
}

class PongGame {
	private c: CanvasRenderingContext2D;

	private ballArray: Array<PongGameBall> = [];
	private ball: PongGameBall;
	private lPaddle: PongGamePaddle;
	private rPaddle: PongGamePaddle;

	constructor(private canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("2D context not supported");
		this.c = ctx;

		const CenterY = canvas.height / 2;
		const CenterX = canvas.width / 2;

		for(let i = 0; i < 200 ; i++) {
			let x = Math.random() * WWidth;
			let y = Math.random() * WHeight;
			let vx = (Math.random() - 0.5) * 3;
			let vy = (Math.random() - 0.5) * 3;
			// console.log("x:", x, "y:", y);
			this.ballArray.push(new PongGameBall(this.c, x, y, vx, vy, "white"));
		}

		this.ball = new PongGameBall(this.c, CenterX, CenterY, 5, 3, "white")
		this.lPaddle = new PongGamePaddle(this.c, 1, CenterY)
		this.rPaddle = new PongGamePaddle(this.c, canvas.width - 10, CenterY)
	}

	collisionCheck(){

		if(this.ball.getX() < this.lPaddle.getX() + this.lPaddle.getPaddleWidth() &&
			this.ball.getY() < this.lPaddle.getY() + this.lPaddle.getPaddleHeight() &&
			this.ball.getY() > this.lPaddle.getY())
		{
			// console.log(lPaddleDist, rPaddleDist)
			this.ball.setColor("#4F48F0")
		}
		else if(this.ball.getX() > this.rPaddle.getX() - this.rPaddle.getPaddleWidth() &&
			this.ball.getY() > this.rPaddle.getY() &&
			this.ball.getY() < this.rPaddle.getY() + this.rPaddle.getPaddleHeight())
		{
			// console.log(lPaddleDist, rPaddleDist)
			this.ball.setColor("#4F48F0")
		}
		else this.ball.setColor("#BC48F0");
	}

	start() {
		this.gameLoop();		
	}
	private gameLoop() {
		this.c.clearRect(0, 0, WWidth, WHeight);

		this.ball.updatePos(this.lPaddle, this.rPaddle);
		this.ball.drawPos();
		this.lPaddle.updatePos(keys.has('s'), keys.has('w'));
		this.lPaddle.drawPos();
		this.rPaddle.updatePos(keys.has('ArrowDown'), keys.has('ArrowUp'));
		this.rPaddle.drawPos();
	
		for(let i = 0; i < this.ballArray.length ; i++) {
			this.ballArray[i].updatePos(this.lPaddle, this.rPaddle);
		}

   		requestAnimationFrame(() => this.gameLoop());
  	}
}
