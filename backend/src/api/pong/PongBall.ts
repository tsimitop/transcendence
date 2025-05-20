
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
	private speed: number = 1.3;
	private size: number = 15;
	private lcollisionCount: number = 0;
	private rcollisionCount: number = 0;
	private lcollisionFlag: boolean = true;
	private rcollisionFlag: boolean = true;


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
constructor({x , y, radius}: BallParams) {
    this.x = x;
    this.y = y;
    // this.vx = 0.001 + Math.random() * (0.005 - 0.001);
    // this.vy = 0.001 + Math.random() * (0.005 - 0.001);
    this.vx = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
    this.vy = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
    this.size = radius;
    // this.color = color;
  }

/*
const base = (0.001 + Math.random() * (0.005 - 0.001));
const randomSignedValue = Math.random() > 0.5 ? (0.001 + Math.random() * (0.005 - 0.001)) : -(0.001 + Math.random() * (0.005 - 0.001));
*/

  
/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

  getVx(): number { return this.vx; }
  getVy(): number { return this.vy; }
  getRadius(): number { return this.size; }
  getSpeed(): number { return this.speed; }

  setVx(x: number) { this.vx *= x; }
  setVy(y: number) { this.vy *= y; }

}
