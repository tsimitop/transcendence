import { PongGameBall } from "./PongBall";


export class PongGame {



/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
private socket: WebSocket;
private ctx: CanvasRenderingContext2D;

private CenterX: number;
private CenterY: number;

private frontendBall: PongGameBall;


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



    constructor(canvas: HTMLCanvasElement, socket: WebSocket) {
    this.socket = socket;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not supported");
    this.ctx = ctx;

    this.CenterY = canvas.height / 2;
    this.CenterX = canvas.width / 2;

    this.frontendBall = new PongGameBall(this.ctx, this.CenterX, this.CenterY, 5, 3, "white");

    // Attach WebSocket message handler
    this.socket.onmessage = this.handleMessage.bind(this);

    }

/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/


    start() {
        // this.sendMessage("getGames");
        // matchmaking

    //     this.socket.send(JSON.stringify({
    //     target_endpoint: 'pong-api',
    //     payload: {
    //         type: "getGames",
    //         pong_data: {}
    //     }
    //   }));
    }
/*****************************************************/
/************** private Methods  *********************/
/*****************************************************/

    private sendMessage(type: string, pong_data: any = {}) {
        if (this.socket.readyState === WebSocket.OPEN) {
          const message = {
            target_endpoint: 'pong-api',
            payload: {
              type,
              pong_data
            }
          };
      
          this.socket.send(JSON.stringify(message));
        } else {
          console.warn("WebSocket is not open. Cannot send message.");
        }
      }
      


    private handleMessage(event: MessageEvent) {
        const data = JSON.parse(event.data);
        const { type, pong_data } = data.payload;
    
        if (type === 'match_found') {
            console.log('Match found! Ready to start game logic...');
            // Start game loop or animations here
            this.startGameLoop();
        }
    
        if (type === 'game_state') {
            // Update positions, scores, etc. from server
            console.log('Game state update:', pong_data);
            // this.updateGame(pong_data);
        }
    }
    

  

    
    startGameLoop(){
        
        this.frontendBall.drawPos();    
    }
    
  }
  