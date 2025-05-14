import { PongGameBall } from "./PongBall";
import { PongGamePaddle } from "./PongPaddle";
import { ThicknessPaddle } from "./constants";
import { WWidth } from "./constants";
import { WHeight } from "./constants";
import { offsetPaddle } from "./constants";

// window.addEventListener('load', () => {
//   const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
//   if (canvas) {
//     const game = new PongGame(canvas);
//     console.log("canvas: ",canvas); 
//     game.start();
//   } else {
//     console.error("Canvas not found!");
//   }
// });

/**************************************************************************/
/**************		INPUT FROM KEYBOARD			***************************/
/**************************************************************************/
const keys = new Set<string>();

window.addEventListener("keydown", (event) => {
  keys.add(event.key);

});

window.addEventListener("keyup", (event) => {
  	keys.delete(event.key);
	// Reset the pause handling flag when the key is released
	if (event.key === 'p') {
		pauseHandled = false;
	}
});


let pauseHandled = false;


export class PongGame {
	private ctx: CanvasRenderingContext2D;

	private ball: PongGameBall;
	private lPaddle: PongGamePaddle;
	private rPaddle: PongGamePaddle;
    private CenterX: number;
    private CenterY: number;
	private isPaused: boolean = false;
	private isEnd: boolean = false;
    private lPlayerReady: boolean = true;
    private rPlayerReady: boolean = true;
    private lPlayerScore: number = 0;
    private rPlayerScore: number = 0;
    private maxScore: number = 2;

	constructor(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("2D context not supported");
		this.ctx = ctx;

		this.CenterY = canvas.height / 2;
		this.CenterX = canvas.width / 2;

		this.ball = new PongGameBall(this.ctx, this.CenterX, this.CenterY, 5, 3, "white")
		this.lPaddle = new PongGamePaddle(this.ctx, offsetPaddle, this.CenterY)
		this.rPaddle = new PongGamePaddle(this.ctx, canvas.width - ThicknessPaddle - offsetPaddle, this.CenterY)
	}
	start()
	{
		// this.ctx.fillStyle = '#ffffff';
		// this.ctx.fillText("PressKeyToBegin", WWidth/2, WHeight/2);
		if(this.lPlayerReady && this.rPlayerReady)
		{
			this.gameLoop();
		};
    }
    restartGame(fullRestart: boolean){
        this.ball.reset(this.CenterX, this.CenterY); 
        this.lPaddle.reset(this.CenterY); 
        this.rPaddle.reset(this.CenterY);
        keys.clear();

        // Optionally reset scores, states, etc.
        this.isPaused = false;
        if(fullRestart)
        {
            this.lPlayerScore = 0;
            this.rPlayerScore = 0;
			this.lPlayerReady = false;
			this.rPlayerReady = false;	
        }

        console.log("Game restarted");
    }
    checkPause():boolean{
		if (keys.has('p') && !pauseHandled) {
			this.isPaused = !this.isPaused;
			console.log("Paused:", this.isPaused);
			pauseHandled = true;
		}
		if(this.isPaused){
			if(!this.isEnd){

				this.ctx.fillStyle = "white";
				this.ctx.font = "48px sans-serif";
				this.ctx.textAlign = "center";
				this.ctx.fillText("Paused", WWidth / 2, WHeight / 2);
			}
				return true;
			
		}
		return false;
	}
	checkEndOfGame() {
		if (this.lPlayerScore >= this.maxScore || this.rPlayerScore >= this.maxScore) {
			this.ctx.fillStyle = "white";
			this.ctx.font = "48px sans-serif";
			this.ctx.textAlign = "center";
	
			if (this.lPlayerScore >= this.maxScore) this.ctx.fillText("WIN left", WWidth / 2, WHeight / 2);
			if (this.rPlayerScore >= this.maxScore) this.ctx.fillText("WIN right", WWidth / 2, WHeight / 2);
	
			this.isPaused = true;
			this.isEnd = true;
			
			setTimeout(() => {
				this.restartGame(true);
				this.isPaused = false;
				this.isEnd = false;
			}, 2000);
		}
	}
	
	checkScore(){
		if (this.ball.getX() < 0  || this.ball.getX() > WWidth)
		{
			if(this.ball.getX() < 0)
			{
				this.rPlayerScore++;
			}
			if(this.ball.getX() > WWidth)
			{
				this.lPlayerScore++;
			}
			this.restartGame(false);
		}
	}
	drawScore(){
		this.ctx.fillStyle = "white";
		this.ctx.font = "40px Arial";
		this.ctx.textAlign = "center";
		this.ctx.fillText(`${this.lPlayerScore} : ${this.rPlayerScore}`, WWidth / 2,  50);
	}
	private gameLoop() {
		if(this.checkPause()){
			requestAnimationFrame(() => this.gameLoop());
			return;
		}

		this.ctx.clearRect(0, 0, WWidth, WHeight);

		this.ball.updatePos(this.lPaddle, this.rPaddle);
		this.ball.drawPos();
		this.lPaddle.updatePos(keys.has('s'), keys.has('w'));
		this.lPaddle.drawPos();
		this.rPaddle.updatePos(keys.has('ArrowDown'), keys.has('ArrowUp'));
		this.rPaddle.drawPos();
		this.checkScore();
		this.drawScore();

		this.checkEndOfGame();
   		requestAnimationFrame(() => this.gameLoop());
  	}

}
