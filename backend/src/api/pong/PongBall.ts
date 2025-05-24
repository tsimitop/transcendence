
interface BallParams {
	x: number;
	y: number;
	radius: number;
  }

export class PongGameBall {

/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private speed: number = 2;
	private size: number = 15;


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
constructor({x , y, radius}: BallParams) {
    this.x = x;
    this.y = y;
    this.vx = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
    this.vy = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
    this.size = radius;
  }

  
/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

  getVx(): number { return this.vx; }
  getVy(): number { return this.vy; }
  getX(): number { return this.x; }
  getY(): number { return this.y; }
  getRadius(): number { return this.size; }
  getSpeed(): number { return this.speed; }

  setVx(x: number) { this.vx *= x; }
  setVy(y: number) { this.vy *= y; }
  setX(x: number) { this.x += x; }
  setY(y: number) { this.y += y; }
  setSpeed(s: number) { this.speed += s; }

  reset(){ 
    this.x = 0.5;
    this.y = 0.5;
    this.vx = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
    this.vy = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
    this.speed = 2;
   }

}
