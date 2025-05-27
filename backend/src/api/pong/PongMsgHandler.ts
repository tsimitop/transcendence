import {PongMessage, PongErrorData, KeyboardInputData, LocalGame, CreateGameData} from './PongMessages';
import { connectedUsers } from '../../websocket/WebSocket';
import { PongGame } from './PongGame';
import { JoinGameData } from './PongMessages';
import { Tournament } from './PongTournament';


/***  Tournament  ***/
import { handleListTournament } from './PongMsgHandlerTournament';
import { handlerJoinTournament } from './PongMsgHandlerTournament';
import { handleCreateTournament } from './PongMsgHandlerTournament';

/***  Game  ***/
import { handleListGames } from './PongMsgHandlerGame';
import { handlerJoinGame } from './PongMsgHandlerGame';
import { handleCreateGame } from './PongMsgHandlerGame';

export const currentGames: Map<string, PongGame> = new Map();
export const currentTournaments: Map<string, Tournament> = new Map()
export const globalCountdown = 2;

/******************************/
/**             DEBUG         */
/******************************/
// const test = setInterval(() => {
//   console.log("List");
//   for (const [username, tournament] of currentTournaments.entries()) {
//     console.log(tournament.getUniqeID());
//     console.log(tournament.getAllPlayers());
//   }
  
//   for (const [username, games] of currentGames.entries()) {
//     console.log(games.getUniqeID());
//   }
  
// }, 1000);
/******************************/
/**        DEBUG END          */
/******************************/



export function handlePongPayload(senderUsername: string, payload: any): void {
  // console.log(payload);
  try {
    // The payload is already parsed in MessageHandler.ts
    const message: PongMessage = {
      type: payload.type,
      pong_data: payload.pong_data,
    };

    switch (message.type) {
      case 'input':
        handleInput(senderUsername, message.pong_data);
        break;
      case 'game_list':
        handleListGames(senderUsername);
        break;
      case 'join_game':
        handlerJoinGame(senderUsername, message.pong_data);
        break;
      case 'create_game':
        handleCreateGame(senderUsername, message.pong_data);
        break;
      case 'tournament_list':
        handleListTournament(senderUsername);
        break;
      case 'join_tournament':
        handlerJoinTournament(senderUsername, message.pong_data);
        break;
      case 'create_tournament':
        handleCreateTournament(senderUsername, message.pong_data);
        break;
      default:
        sendErrorMessage(senderUsername, `Unknown message type: ${message.type}`, 4001);
        console.warn(`[PONG WS] Unknown message: ${message}`);
    }
  } catch (err) {
    console.error(`[PONG WS] Failed to process message ${payload}:`, err);
  }
}


function handleInput(senderUsername: string, pong_data: KeyboardInputData): void {
    
  
  // console.log(username, game.getUniqeID());
  for (const [username, game] of currentGames.entries()) {
    
    // console.log(pong_data.paddle, game.gameMode)

      if(pong_data.userId === game.getlPlayerName() && game.gameMode === "remote" ||
        game.gameMode === "local" && pong_data.paddle === "left"
    ){
        if(pong_data.up === true){
          game.lPaddle.updatePos(false, true);
          break;
        }
        else if(pong_data.up === false){
          
          game.lPaddle.updatePos(true, false);
          break;
        }
        else {
          break;
        }
      }
      else if(pong_data.userId === game.getrPlayerName() && game.gameMode === "remote" || 
      game.gameMode === "local" && pong_data.paddle === "right"
    ){
        if(pong_data.up === true){
          
          game.rPaddle.updatePos(false, true);
          break;
        }
        else if(pong_data.up === false){
          
          game.rPaddle.updatePos(true, false);
          break;
        }
        else {
          break;
        }
      }
  }
}

export function endOfGame(user: string, message: string) {
  // console.log("user dissssssssconected");
  for (const [username, game] of currentGames.entries()) {
    if(user === game.getlPlayerName() || user === game.getrPlayerName()) {
      game.setGameState("finished");

      const response = {
        target_endpoint: 'pong-api',
        type: 'game_over',
        pong_data: {
          gameId: game.getUniqeID(),
          winnerId: user,
          message: message,
          finalScore: {
            left: game.getlPlayerScore(),
            right: game.getrPlayerScore()
            }
        }
      }
      const lsocket = game.getlPlayerSocket();
      const rsocket = game.getrPlayerSocket();
      currentGames.delete(username);
      if (lsocket && lsocket.readyState === WebSocket.OPEN){
        lsocket.send(JSON.stringify(response));
      }
      if (rsocket && rsocket.readyState === WebSocket.OPEN){
        rsocket.send(JSON.stringify(response));
      }
    }
    // console.log(`Game with key ${username} removed from currentGames`);
    break;
  }
}
  

export function deleteGameBecauseUserReconnected(user: string): void {
  
  for (const [username, game] of currentGames.entries()) {
    console.log(game.getUniqeID(), "<---->", username);
    
    if(user === game.getlPlayerName() || user === game.getrPlayerName()) {
      console.log("setgametofinish")
      game.setGameState("finished");
      // currentGames.delete(user);
      break;
    }
  }
  
  for (const [username, tournament] of currentTournaments.entries()) {
    console.log(tournament.getUniqeID(), "<---->", username);
    if(tournament.getCurrentPlayers() === 1)
        currentTournaments.delete(user);
    else{
      // if more than one player is connected to the game
      console.log("more than one player is waiting only delete the one that left")
      console.log(tournament.getAllPlayers())
      console.log(user, "----", username)
      tournament.removePlayer(user);
    } 
  }
}


/**********************************************************************************/

function sendMessage(senderUsername: string, type: string, pong_data: any): void {
  // used to send messages to the client
  const message: PongMessage = {
      type: type,
      pong_data: pong_data,
  };
  // const wrapped_msg: WebsocketApiRequest = {
  //   target_endpoint: "pong-api",
  //   payload: message
  // }

  // const socket = connectedUsers.get(senderUsername);
  // if (socket) {
  //     socket.send(JSON.stringify(wrapped_msg));
  // } else {
  //     console.debug(`[PONG WS] User ${senderUsername} not connected, cant send message`);
  // }
}

function sendErrorMessage(senderUsername: string, errorMessage: string, errorCode: number = 69420): void {
  // used to send error messages to the client

  const errorData: PongErrorData = {
      message: errorMessage,
      code: errorCode,  // do we really need this?
  };
  sendMessage(senderUsername, 'error', errorData);
  console.debug(`[PONG WS] Error message sent to ${senderUsername}: ${errorMessage} (code: ${errorCode})`);
}