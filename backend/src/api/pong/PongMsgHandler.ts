import {PongMessage, PongErrorData, KeyboardInputData, LocalGame, CreateGameData} from './PongMessages';
import { connectedUsers } from '../../websocket/WebSocket';
import { PongGame } from './PongGame';
import { JoinGameData } from './PongMessages';
import { Tournament } from './PongTournament';

const currentGames: Map<string, PongGame> = new Map();
const currentTournaments: Map<string, Tournament> = new Map()
const globalCountdown = 2;


const test = setInterval(() => {
    console.log("List");
    for (const [username, tournament] of currentTournaments.entries()) {
      console.log(tournament.getUniqeID());
    }

    for (const [username, games] of currentGames.entries()) {
      console.log(games.getUniqeID());
    }

}, 1000);

export function deleteGameBecauseUserReconnected(user: string, message: string): void {
  
  for (const [username, game] of currentGames.entries()) {
    console.log(game.getUniqeID(), "<---->", username);
    
    if(user === game.getlPlayerName() || user === game.getrPlayerName()) {
      game.setGameState("finished");
      currentGames.delete(user);
    }
    break;
  }
  
  for (const [username, tournament] of currentTournaments.entries()) {
    console.log(tournament.getUniqeID(), "<---->", username);
    if(tournament.getCurrentPlayers() === 1)
        currentTournaments.delete(user);
    else{
      // if more than one player is connected to the game
      console.log("more than one player is waiting only delete the one that left")

    }
    
  }
}


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
      case 'getGames':
        handleGetGames(senderUsername);
        break;
      // case 'create_game':  // mhhh mixed case types
      //   handleCreateGame(senderUsername, message.pong_data);
      //   break;
      default:
        sendErrorMessage(senderUsername, `Unknown message type: ${message.type}`, 4001);
        console.warn(`[PONG WS] Unknown message: ${message}`);
    }
  } catch (err) {
    console.error(`[PONG WS] Failed to process message ${payload}:`, err);
  }
}


/*****************************************************/
/************** ajehles Methods  *********************/
/*****************************************************/
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

function handleListTournament(senderUsername: string): void {
  // console.log("handleListTournament");
  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  const tournamentList = [];

  for (const [username, tournament] of currentTournaments.entries()) {
    tournamentList.push({
      id: tournament.getUniqeID(),
      owner: username,
      alias: tournament.getlPlayerAlias(),
      state: tournament.getTournamentState(),
      // optionally include player names, number of players, etc. tournament?
    });
  }
  
  const response = {
    target_endpoint: 'pong-api',
    type: 'tournament_list',
    games: tournamentList,
  };
  
  // console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
}

function handleCreateTournament(senderUsername: string, pong_data: CreateGameData): void {

  // console.log("Tournament");
  // console.log(pong_data);

  // create tournament
  const uniqueGameID = `${senderUsername}-Tournament-${Date.now()}`;
  const newTournament = new Tournament(uniqueGameID, senderUsername, pong_data.playerAlias);

  // add tournament to list
  currentTournaments.set(senderUsername, newTournament);

}

function handlerJoinTournament(senderUsername: string, pong_data: JoinGameData): void {

  // console.log("handlerJoinTournament")
  // console.log(senderUsername, pong_data)
  // let countdown = globalCountdown;

  // const senderSocket = connectedUsers.get(senderUsername);
  // if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  // let opponent: string = "";
  // console.log("game id", pong_data);
  // for (const [username, game] of currentGames.entries()) {
  //   if(pong_data.gameId === game.getUniqeID()){
  //     game.setGameState('countdown');
  //     game.setOpponentName(senderUsername, pong_data.OpponentAlias);
  //     console.log("-->",game.getrPlayerName(), game.getrPlayerAlias());
  //     opponent = username;
  //     break;
  //   }
  // }
  // console.log("opponent ", opponent);
  // const opponentSocket = connectedUsers.get(opponent);
  // if (!opponentSocket || opponentSocket.readyState !== WebSocket.OPEN) return;
  // const response = {
  //       target_endpoint: 'pong-api',
  //       type: 'countdown',
  //       value : countdown
  // };
  
  // console.log("response:", response); 
  // senderSocket.send(JSON.stringify(response));
  // opponentSocket.send(JSON.stringify(response));

  // // set sockets to current instance
  // currentGames.get(opponent)?.setSockets(senderSocket, opponentSocket);
  

  
  //   const interval = setInterval(() => {
  //   countdown--;
  //   if (countdown <= 0) {
  //     clearInterval(interval);
  //     for (const [username, game] of currentGames.entries()) {
  //       if(pong_data.gameId === game.getUniqeID()){
  //         game.setGameState('playing');
  //         opponent = username;
  //         break; 
  //       }
  //     }
  //     startGameLoop(currentGames.get(opponent)!);



  //     setTimeout(() => {
  //     }, 1000);
  //   } 
  // }, 1000);
}


function handlerJoinGame(senderUsername: string, pong_data: JoinGameData): void {
  let countdown = globalCountdown;


  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  let opponent: string = "";
  // console.log("game id", pong_data);
  for (const [username, game] of currentGames.entries()) {
    if(pong_data.gameId === game.getUniqeID()){
      game.setGameState('countdown');
      game.setOpponentName(senderUsername, pong_data.OpponentAlias);
      // console.log("-->",game.getrPlayerName(), game.getrPlayerAlias());
      opponent = username;
      break;
    }
  }
  // console.log("opponent ", opponent);
  const opponentSocket = connectedUsers.get(opponent);
  if (!opponentSocket || opponentSocket.readyState !== WebSocket.OPEN) return;
  const response = {
        target_endpoint: 'pong-api',
        type: 'countdown',
        value : countdown
  };
  
  // console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
  opponentSocket.send(JSON.stringify(response));

  // set sockets to current instance
  currentGames.get(opponent)?.setSockets(senderSocket, opponentSocket);
  

  
    const interval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(interval);
      for (const [username, game] of currentGames.entries()) {
        if(pong_data.gameId === game.getUniqeID()){
          game.setGameState('playing');
          opponent = username;
          break; 
        }
      }
      startGameLoop(currentGames.get(opponent)!);



      setTimeout(() => {
      }, 1000);
    } 
  }, 1000);
}


function startGameLoop(game: PongGame) {
  const fps = 30;
  const intervalMs = 1000 / fps;
  
  const intervalId = setInterval(() => {    
  if (game.getGameState() === 'finished') {
    clearInterval(intervalId);
    // console.log(`Game ${game.getUniqeID()} ended.`);

    return;
    }
    game.update();
    const gameState = game.getGameStatePayload();
    const response = {
          target_endpoint: 'pong-api',
          type: 'game_state',
          game: {
            id: game.getUniqeID(),
            status: game.getGameState(),
            ball: {
                x: gameState.game.ball.x,
                y: gameState.game.ball.y,
            },
            leftPaddle: {
                topPoint: {
                    x: 0,
                    y: gameState.game.leftPaddle.topPoint.y,
                },
                height: 0.2,  // percentage of window height (0-1)
              },
              rightPaddle: {
              topPoint: {
                  x: 0.99,
                  y: gameState.game.rightPaddle.topPoint.y,
              },
              height: 0.2,  // percentage of window height (0-1)
            },
            lastUpdateTime: 1,
            maxScore: 10,
            scores: [
                { alias: game.getlPlayerAlias(), score: game.getlPlayerScore() },
                { alias: game.getrPlayerAlias(), score: game.getrPlayerScore() }
            ],

            countdown: 5,
            // gameMode: "missing" // not needed here?
      }
  };


    const lPlayerSocket = game.getlPlayerSocket();
    const rPlayerSocket = game.getrPlayerSocket();
    if (lPlayerSocket && lPlayerSocket.readyState === WebSocket.OPEN) {
      lPlayerSocket.send(JSON.stringify(response));
    }
    if (rPlayerSocket && rPlayerSocket.readyState === WebSocket.OPEN) {
      rPlayerSocket.send(JSON.stringify(response));
    }
  }, intervalMs);
}





function handleListGames(senderUsername: string): void {
  const senderSocket = connectedUsers.get(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  const gameList = [];

  for (const [username, game] of currentGames.entries()) {
    gameList.push({
      id: game.getUniqeID(),
      owner: username,
      alias: game.getlPlayerAlias(),
      state: game.getGameState(),
      // optionally include player names, number of players, etc. tournament?
    });
  }
  
  const response = {
    target_endpoint: 'pong-api',
    type: 'game_list',
    games: gameList,
  };
  
  // console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
}




function handleCreateGame(senderUsername: string, pong_data: CreateGameData): void {

  // console.log("pong_data.gameMode ", pong_data.gameMode);
  const uniqueGameID = `${senderUsername}-Game-${Date.now()}`;
  const newGame = new PongGame(uniqueGameID, senderUsername, pong_data.playerAlias, pong_data.gameMode);
  currentGames.set(senderUsername, newGame);

  const senderSocket = connectedUsers.get(senderUsername);
  if(pong_data.gameMode === "remote"){
    // REMOTE GAME
    if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
      const response = {
        target_endpoint: 'pong-api',
        type: 'game_created',
        gameId: uniqueGameID
      };
      senderSocket.send(JSON.stringify(response));
    }
  }
  else {
    // LOCAL GAME
    newGame.setOpponentName(senderUsername, pong_data.localOpponent);
    // or
    // newGame.setOpponentName(pong_data.localOpponent, pong_data.localOpponent);
    newGame.setGameState("countdown");
    if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;


    /********* */
    // for local game needed to prevent errors
    newGame.setSockets(senderSocket, senderSocket);
    /********* */
    let countdown = globalCountdown;

    const response = {
      target_endpoint: 'pong-api',
      type: 'countdown',
      value : countdown
    };
    // console.log("response:", response); 
    senderSocket.send(JSON.stringify(response));
    
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        newGame.setGameState("playing")
        startGameLoop(newGame);
      }
    }, 1000);
    
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
  
   /*****************************************************/
  /************** ajehles Methods end *********************/
  /*****************************************************/



// function handleKeyboardInput(senderUsername: string, message: KeyboardInputData): void {
//   const { userId, lup } = message;
//   if (userId !== senderUsername) {
//     console.warn(`[PONG] User ID mismatch: expected ${senderUsername}, got ${userId}`);
//     sendErrorMessage(senderUsername, `User ID mismatch, you trying to cheat?`, 4002);
//     return;
//   }

//   // TODO: pass to engine

//   // Handle keyboard input
//   console.debug(`[PONG] Keyboard input from ${userId}: ${lup ? 'UP' : 'DOWN'}`);
// }

function handleGetGames(senderUsername: string): void {
  console.debug(`[PONG] user ${senderUsername} requested games`);
  
  // dummy waiting game for testing the 'lobby'
  // TODO: Implement return of actual waiting games list
  // const dummy_game: GameStateData = {
  //   game: {
  //     id: "game-123456",
  //     status: "waiting",
  //     ball: {
  //       x: "0.0",
  //       y: "0.0"
  //     },
  //     leftPaddle: {
  //       topPoint: {
  //         x: 0.05,
  //         y: 0.35
  //       },
  //       height: 0.2
  //     },
  //     rightPaddle: {
  //       topPoint: {
  //         x: 0.95,
  //         y: 0.40
  //       },
  //       height: 0.2
  //     },
  //     lastUpdateTime: Date.now(),
  //     maxScore: 10,
  //     scores: {
  //       "player1": 3,
  //       "player2": 5
  //     },
  //     countdown: 0
  //   }
  // };
  
  // TODO add all games into this list, then pass the list to sendMessages
  // const waiting_games: GameStateData[] = [dummy_game];
 
  // sendMessage(senderUsername, 'game_states', waiting_games);
  // console.debug(`returning ${waiting_games.length} games`)
}

// function handleCreateGame(senderUsername: string, pong_data: CreateGameData): void {
//   console.log(`got create game ${pong_data}`)
// }



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