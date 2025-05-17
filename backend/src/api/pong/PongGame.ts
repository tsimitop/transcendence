import { WebSocket } from 'ws';



export class PongGame {


/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
// private socket: WebSocket;


/*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/



constructor(socket: WebSocket) {

    socket.send(JSON.stringify({
              target_endpoint: 'pong-api', // <== match what frontend expects
              payload: {
                type: 'match_found',
                pong_data: {
                  match_id: 'abc123'
                }
              }
            }));

    }

}