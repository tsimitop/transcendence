
// // PongGame.ts

// export default class PongGame {
//   private canvas: HTMLCanvasElement;
//   private ctx: CanvasRenderingContext2D;
//   private ballX = 0;
//   private ballY = 0;
//   private ballSpeedX = 4;
//   private ballSpeedY = 3;

//   constructor(canvas: HTMLCanvasElement) {
//     this.canvas = canvas;
//     const context = canvas.getContext("2d");
//     if (!context) throw new Error("Canvas context not available");
//     this.ctx = context;

//     this.ballX = canvas.width / 2;
//     this.ballY = canvas.height / 2;

//     this.start();
//   }

//   private draw(): void {
//     this.ctx.fillStyle = "black";
//     this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

//     this.ctx.fillStyle = "white";
//     this.ctx.beginPath();
//     this.ctx.arc(this.ballX, this.ballY, 10, 0, Math.PI * 2);
//     this.ctx.fill();
//   }

//   private update(): void {
//     this.ballX += this.ballSpeedX;
//     this.ballY += this.ballSpeedY;

//     if (this.ballY <= 0 || this.ballY >= this.canvas.height) {
//       this.ballSpeedY *= -1;
//     }

//     if (this.ballX <= 0 || this.ballX >= this.canvas.width) {
//       this.ballSpeedX *= -1;
//     }
//   }

//   private loop = () => {
//     this.update();
//     this.draw();
//     requestAnimationFrame(this.loop);
//   };

//   private start(): void {
//     this.loop();
//   }
// }
