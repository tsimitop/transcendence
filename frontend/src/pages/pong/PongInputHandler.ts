
export class PongInputHandler {


  /*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
  private keys = {
    up: { pressed: false },  
    down: { pressed: false },
    w: { pressed: false },  
    s: { pressed: false },
  }  

  private readonly TICKRATE = 15 // 15ms
  private intervalId: number | null = null;

/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
constructor(private socket: WebSocket, private userId: string) {
  console.log("InputHandler is generated");
}

/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/

public start(): void {
  window.addEventListener("keydown", this.handleKeyDown);
  window.addEventListener("keyup", this.handleKeyUp);

  const response = {
    target_endpoint: 'pong-api',
    payload: {
      type: 'input',
      pong_data : {
        userId: this.userId,
        up: false,
        paddle: "left"
      }
    }
  }
  setInterval(() => {
    if(this.keys.up.pressed) {
      response.payload.pong_data.userId = this.userId;
      response.payload.pong_data.up = true;
      response.payload.pong_data.paddle = "right";
      this.socket.send(JSON.stringify(response));
      
    }
    if(this.keys.down.pressed) {
      response.payload.pong_data.userId = this.userId;
      response.payload.pong_data.up = false;
      response.payload.pong_data.paddle = "right";
      this.socket.send(JSON.stringify(response));
    }
    if(this.keys.w.pressed) {
      response.payload.pong_data.userId = this.userId;
      response.payload.pong_data.up = true;
      response.payload.pong_data.paddle = "left";
      this.socket.send(JSON.stringify(response));
    }
    if(this.keys.s.pressed) {
      response.payload.pong_data.userId = this.userId;
      response.payload.pong_data.up = false;
      response.payload.pong_data.paddle = "left";
      this.socket.send(JSON.stringify(response));
    }
  }, this.TICKRATE); 
}

public stop(): void {
  if (this.intervalId !== null) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

private handleKeyDown = (event: KeyboardEvent): void => {
  switch (event.code) {
    case "ArrowDown":
      this.keys.down.pressed = true;
      break;
    case "ArrowUp":
      this.keys.up.pressed = true;
      break;
    case "KeyW":
      this.keys.w.pressed = true;
      break;
    case "KeyS":
      this.keys.s.pressed = true;
      break;
  }
}
private handleKeyUp = (event: KeyboardEvent): void => {
  switch (event.code) {
    case "ArrowDown":
      this.keys.down.pressed = false;
      break;
    case "ArrowUp":
      this.keys.up.pressed = false;
      break;
    case "KeyW":
      this.keys.w.pressed = false;
      break;
    case "KeyS":
      this.keys.s.pressed = false;
      break;
  }
}

}
