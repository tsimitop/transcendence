
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
        userId: "string",
        up: false
      }
    }
  }

  setInterval(() => {
    if(this.keys.up.pressed) {
      // console.log("UP IS PRESSED")
      response.payload.pong_data.up = true;
      this.socket.send(JSON.stringify(response));

      // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: -SPEED})
      // frontendPlayers[socket.id].y -= SPEED;     // Moving via Frontend
      // socket.emit('keydown',{keycode: 'KeyW', sequenceNumber})          // Moving via Backend
    }
    if(this.keys.down.pressed) {
      // console.log("DOWN IS PRESSED")
      response.payload.pong_data.up = false;
      this.socket.send(JSON.stringify(response));

      // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: SPEED})
      // frontendPlayers[socket.id].y += SPEED;
      // socket.emit('keydown', {keycode: 'KeyS', sequenceNumber})
    }
    if(this.keys.w.pressed) {
      // console.log("W IS PRESSED")
      response.payload.pong_data.up = true;
      this.socket.send(JSON.stringify(response));

      // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: -SPEED})
      // frontendPlayers[socket.id].y -= SPEED;     // Moving via Frontend
      // socket.emit('keydown',{keycode: 'KeyW', sequenceNumber})          // Moving via Backend
    }
    if(this.keys.s.pressed) {
      // console.log("S IS PRESSED")
      response.payload.pong_data.up = false;
      this.socket.send(JSON.stringify(response));

      // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: SPEED})
      // frontendPlayers[socket.id].y += SPEED;
      // socket.emit('keydown', {keycode: 'KeyS', sequenceNumber})
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
/******************************************/
// keyboard input
/******************************************/
// const SPEED = 5
// const TICKRATE = 15 // 15ms

// const keys = {
//   up: {
//     pressed: false
//   },

//   down: {
//     pressed: false
//   },
//   w: {
//     pressed: false
//   },

//   s: {
//     pressed: false
//   },
// }

// setInterval(() => {
//   if(keys.up.pressed) {
//     console.log("UP IS PRESSED")
//     this.socket.send(JSON.stringify({
//       target_endpoint: 'pong-api',
//       payload: {
//         type: 'input',
//         pong_data : {
//           userId: "string",
//           up: true
//         }
//       }
//     }));
//     // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: -SPEED})
//     // frontendPlayers[socket.id].y -= SPEED;     // Moving via Frontend
//     // socket.emit('keydown',{keycode: 'KeyW', sequenceNumber})          // Moving via Backend
//   }
//   if(keys.down.pressed) {
//     console.log("DOWN IS PRESSED")
//     // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: SPEED})
//     // frontendPlayers[socket.id].y += SPEED;
//     // socket.emit('keydown', {keycode: 'KeyS', sequenceNumber})
//   }
//   if(keys.w.pressed) {
//     console.log("W IS PRESSED")
//     // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: -SPEED})
//     // frontendPlayers[socket.id].y -= SPEED;     // Moving via Frontend
//     // socket.emit('keydown',{keycode: 'KeyW', sequenceNumber})          // Moving via Backend
//   }
//   if(keys.s.pressed) {
//     console.log("S IS PRESSED")
//     // playerInputs.push({sequenceNumber: sequenceNumber, dx: 0, dy: SPEED})
//     // frontendPlayers[socket.id].y += SPEED;
//     // socket.emit('keydown', {keycode: 'KeyS', sequenceNumber})
//   }
// }, TICKRATE); 

// window.addEventListener('keydown', (event) => {
//   // if(!frontendPlayers[socket.id])
//   //   return;
//   // console.log(event);
//   switch(event.code){
//     case 'ArrowDown':{
//       keys.down.pressed = true;
//       break;
//     }
//     case 'ArrowUp':{
//       keys.up.pressed = true;
//       break;
//     }
//     case 'KeyW':{
//       keys.w.pressed = true;
//       break;
//     }
//     case 'KeyS':{
//       keys.s.pressed = true;
//       break;
//     }
//   }
// })

// window.addEventListener('keyup', (event) => {
//   // if(!frontendPlayers[socket.id])
//   //   return;
//   switch(event.code){
//     case 'ArrowDown':{
//       keys.down.pressed = false;
//       break;
//     }
//     case 'ArrowUp':{
//       keys.up.pressed = false;
//       break;
//     }
//     case 'KeyW':{
//       keys.w.pressed = false;
//       break;
//     }
//     case 'KeyS':{
//       keys.s.pressed = false;
//       break;
//     }
//   }
// })
