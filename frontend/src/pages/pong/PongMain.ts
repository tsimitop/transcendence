import { PongGameBall } from "./PongBall";
import { PongGamePaddle } from "./PongPaddle";
import { ThicknessPaddle } from "./constants";
import { WWidth } from "./constants";
import { WHeight } from "./constants";
import { offsetPaddle } from "./constants";

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

	private data;
	private ctx: CanvasRenderingContext2D;

	private ball: PongGameBall;
	private lPaddle: PongGamePaddle;
	private rPaddle: PongGamePaddle;
    private CenterX: number;
    private CenterY: number;
	private isPaused: boolean = false;
	private isEnd: boolean = false;
    private lPlayerReady: boolean = false;
    private rPlayerReady: boolean = false;
    private lPlayerScore: number = 0;
    private rPlayerScore: number = 0;
    private maxScore: number = 0;
	private lPlayerName: string = "PlayerOne";
	private rPlayerName: string = "PlayerTwo";

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
	displayCountdown()
	{
		// Countdown timer (3, 2, 1)
		let countdown = 0;
		this.ctx.fillStyle = 'white';
		this.ctx.font = "48px sans-serif";
		this.ctx.textAlign = "center";
		
		const countdownInterval = setInterval(() => {
			// Clear the canvas each time before showing the new countdown number
			this.ctx.clearRect(0, 0, WWidth, WHeight);
			this.ctx.fillText(countdown.toString(), WWidth / 2, WHeight / 2);
			
			countdown--;
			
			if (countdown < 0) {
				clearInterval(countdownInterval); // Stop the interval

				this.gameLoop(); // Start the game loop
				return;
			}
		}, 1000); // Update every second
	}
	
	/****************************************/
	private async fetchPlayerData() {
		try {
			const response = await fetch("mockData.json");
			const data = await response.json();
			this.data = data;
			console.log("Fetched player data:", data);
			
			this.lPlayerName = data.left.name;
			this.rPlayerName = data.right.name;
			this.lPlayerScore = data.left.score;
			this.rPlayerScore = data.right.score;
			this.lPlayerReady = data.left.ready;
			this.rPlayerReady = data.right.ready;
			this.maxScore = data.main.maxScore;
	
		} catch (err) {
			console.error("Failed to fetch player data:", err);
		}
	}
	
	  
	/****************************************/
	start() {
		this.ctx.fillStyle = 'white';
		this.ctx.font = "48px sans-serif";
		this.ctx.textAlign = "center";
		let message: string = "Waiting for Players to be ready";
		this.ctx.fillText(message, WWidth / 2, WHeight / 2);

		this.fetchPlayerData();


		const readinessCheckInterval = setInterval(() => {
			if (this.lPlayerReady && this.rPlayerReady) {
				clearInterval(readinessCheckInterval);
				this.displayCountdown();
			}
			this.fetchPlayerData();
		}, 1000);  // Check every second 1000ms
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
			this.lPlayerReady = true;
			this.rPlayerReady = true;	
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
	
			if (this.lPlayerScore >= this.maxScore) this.ctx.fillText("Left Player WIN", WWidth / 2, WHeight / 2);
			else if (this.rPlayerScore >= this.maxScore) this.ctx.fillText("Right Player WIN", WWidth / 2, WHeight / 2);
	
			this.isPaused = true;
			this.isEnd = true;
			
			// setTimeout(() => {
			// 	this.restartGame(true);
			// 	this.isPaused = false;
			// 	this.isEnd = false;
			// 	this.start();
			// }, 2000);
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
	drawScoreAndName(){
		this.ctx.fillStyle = "white";
		this.ctx.font = "40px Arial";
		this.ctx.textAlign = "center";
		this.ctx.fillText(`${this.lPlayerName} ${this.lPlayerScore} : ${this.rPlayerScore} ${this.rPlayerName}`, WWidth / 2,  50);
		this.ctx.fillText(`Winning Score: ${this.maxScore}`, WWidth / 2,  WHeight - 20);
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
		this.drawScoreAndName();

		this.checkEndOfGame();

   		requestAnimationFrame(() => this.gameLoop());
  	}
}
