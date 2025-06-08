
import { connectedUsers, getPongSocket } from '../../websocket/WebSocket';
import { currentGames } from './PongMsgHandler';
import { CreateGameData } from './PongMessages';
import { PongGame } from './PongGame';
import { globalCountdown } from './PongMsgHandler';
import { JoinGameData } from './PongMessages';
import { endOfGame } from './PongMsgHandler';


export function handleListGames(senderUsername: string): void {
  const senderSocket = getPongSocket(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  const gameList = [];

  for (const [username, game] of currentGames.entries()) {
    if (game.getGameState() === "waiting") {
      gameList.push({
        id: game.getUniqeID(),
        owner: username,
        alias: game.getlPlayerAlias(),
        state: game.getGameState(),
        // optionally include player names, number of players, etc. tournament?
      });
    }
  }
  
  const response = {
    target_endpoint: 'pong-api',
    type: 'game_list',
    games: gameList,
  };
  
  // console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
}


export function handleCreateGame(senderUsername: string, pong_data: CreateGameData): void {

  // console.log("pong_data.gameMode ", pong_data.gameMode);
  const uniqueGameID = `${senderUsername}-Game-${Date.now()}`;
  const newGame = new PongGame(uniqueGameID, senderUsername, pong_data.playerAlias, pong_data.gameMode);
  currentGames.set(senderUsername, newGame);
  const senderSocket = getPongSocket(senderUsername);
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

export function handlerJoinGame(senderUsername: string, pong_data: JoinGameData): void {
  let countdown = globalCountdown;

  const senderSocket = getPongSocket(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  let opponent: string = "";
  // console.log("game id", pong_data);
  for (const [username, game] of currentGames.entries()) {
    if(pong_data.gameId === game.getUniqeID() 
      && game.getGameState() === "waiting"
      && game.getlPlayerName() !== senderUsername) {  // we cannot join our own game
      game.setGameState('countdown');
      game.setOpponentName(senderUsername, pong_data.OpponentAlias);
      // console.log("-->",game.getrPlayerName(), game.getrPlayerAlias());
      opponent = username;
      break;
    }
  }
  // console.log("opponent ", opponent);
  const opponentSocket = getPongSocket(opponent);
  if (!opponentSocket || opponentSocket.readyState !== WebSocket.OPEN) {
    console.error(`Opponent socket is not open or does not exist: ${opponent}`);
    return;
  }
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


export function startGameLoop(game: PongGame) {
    const fps = 30;
    const intervalMs = 1000 / fps;
    console.log("----------------->",game.getlPlayerAlias())
    const intervalId = setInterval(() => {    
	try {
	  game.update();
	} catch (err) {
	  console.error("Error during game.update():", err);
	}
    if (game.getGameState() === 'finished') {
      clearInterval(intervalId);
      // console.log(`Game ${game.getUniqeID()} ended.`);
  
      return;
      }

	  const lSocket = game.getlPlayerSocket();
	  const rSocket = game.getrPlayerSocket();

      if (!lSocket || lSocket.readyState !== WebSocket.OPEN) {
        endOfGame(game.getrPlayerName(), "Opponent disconnected (left)");
        clearInterval(intervalId);
        return;
      }

      if (!rSocket || rSocket.readyState !== WebSocket.OPEN) {
        endOfGame(game.getlPlayerName(), "Opponent disconnected (right)");
        clearInterval(intervalId);
        return;
      }

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
        console.log("leftplayersend");
        lPlayerSocket.send(JSON.stringify(response));
      }
      else{
        console.log("not leftplayersend");
      }
      if (rPlayerSocket && rPlayerSocket.readyState === WebSocket.OPEN) {
        console.log("rightplayersend");
        rPlayerSocket.send(JSON.stringify(response));
      }
      else{
        console.log("not rightplayersend");
      }
    }, intervalMs);
  }
  