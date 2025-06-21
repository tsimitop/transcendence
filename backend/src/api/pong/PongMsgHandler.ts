import {PongMessage, PongErrorData, KeyboardInputData, LocalGame, CreateGameData} from './PongMessages';
import { connectedUsers, getPongSocket } from '../../websocket/WebSocket';
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
import { startGameLoop } from './PongMsgHandlerGame';
import { insertMatchIntoDb } from './PongMsgHandlerGame';

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
	  case "QUICKMATCH_ACCEPT":
		handleQuickmatchAccept(message.pong_data.from, message.pong_data.against);
		break;
      default:
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

function handleQuickmatchAccept(from: string, against: string): void {
  const socket1 = getPongSocket(from);
  const socket2 = getPongSocket(against);

  if (!socket1 || !socket2) {
    console.warn(`[QUICKMATCH] Missing socket: ${!socket1 ? from : against}`);
    return;
  }

  const gameId = `${from}-${against}-${Date.now()}`;
  const game = new PongGame(gameId, from, from, "remote");

  game.setOpponentName(against, against);
  game.setSockets(socket1, socket2);
  game.setGameState("countdown");

  currentGames.set(from, game);
  currentGames.set(against, game);

  const countdownMsg = {
    target_endpoint: "pong-api",
    type: "countdown",
    value: globalCountdown
  };

  socket1.send(JSON.stringify(countdownMsg));
  socket2.send(JSON.stringify(countdownMsg));

  let countdown = globalCountdown;
  const interval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(interval);
      game.setGameState("playing");
      startGameLoop(game);
	  insertMatchIntoDb(game);
    }
  }, 1000);
}


export function endOfGame(user: string, message: string) {
  for (const [username, game] of currentGames.entries()) {
    const lPlayer = game.getlPlayerName();
    const rPlayer = game.getrPlayerName();

    if (user !== lPlayer && user !== rPlayer) continue;

    game.setGameState("finished");

    const winnerId = user;
    const response = {
      target_endpoint: 'pong-api',
      type: 'game_over',
      pong_data: {
        gameId: game.getUniqeID(),
        winnerId: winnerId,
        message: message,
        finalScore: {
          left: game.getlPlayerScore(),
          right: game.getrPlayerScore(),
        }
      }
    };
    const lsocket = game.getlPlayerSocket();
    const rsocket = game.getrPlayerSocket();
    if (lsocket?.readyState === WebSocket.OPEN) {
      lsocket.send(JSON.stringify(response));
    }
    if (rsocket?.readyState === WebSocket.OPEN) {
      rsocket.send(JSON.stringify(response));
    }

    // Remove game from all player keys (both left and right player)
    currentGames.delete(lPlayer);
    currentGames.delete(rPlayer);

    for (const [_, tournament] of currentTournaments.entries()) {
      if (tournament.hasPlayer(user)) {
        console.log("notifyMatchEnd called with:", user);
        tournament.notifyMatchEnd(user);
        break;
      }
    }
    break;
  }
}

  

export function deleteGameBecauseUserReconnected(user: string): void {
  
  for (const [username, game] of currentGames.entries()) {
    // console.log(game.getUniqeID(), "<---->", username);
    
    if(user === game.getlPlayerName() || user === game.getrPlayerName()) {
      // console.log("setgametofinish")
      // game.setGameState("finished");
      // currentGames.delete(user);
      break;
    }
  }
  
  for (const [username, tournament] of currentTournaments.entries()) {
    // console.log(tournament.getUniqeID(), "<---->", username);
    if(tournament.getCurrentPlayers() === 1)
        currentTournaments.delete(user);
    else{
      // if more than one player is connected to the game
      // console.log("more than one player is waiting only delete the one that left")
      // console.log(tournament.getAllPlayers())
      // console.log(user, "----", username)
      tournament.removePlayer(user);
    } 
  }
}
