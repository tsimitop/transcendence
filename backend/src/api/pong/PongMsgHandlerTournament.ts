import { connectedUsers, getPongSocket } from '../../websocket/WebSocket';
import { currentTournaments } from './PongMsgHandler';
import { Tournament } from './PongTournament';
import { JoinGameData } from './PongMessages';
import { CreateGameData } from './PongMessages';


export function handleListTournament(senderUsername: string): void {
  // console.log("handleListTournament");
  const senderSocket = getPongSocket(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  const tournamentList = [];

  for (const [username, tournament] of currentTournaments.entries()) {
    if (tournament.getTournamentState() === "waiting") {
      tournamentList.push({
        id: tournament.getUniqeID(),
        owner: username,
        alias: tournament.getPlayerOneAlias(),
        state: tournament.getTournamentState(),
        // optionally include player names, number of players, etc. tournament?
      });
    }
  }
  
  const response = {
    target_endpoint: 'pong-api',
    type: 'tournament_list',
    games: tournamentList,
  };
  
  // console.log("response:", response); 
  senderSocket.send(JSON.stringify(response));
}


export function handlerJoinTournament(senderUsername: string, pong_data: JoinGameData): void {

  console.log("handlerJoinTournament")
  const senderSocket = getPongSocket(senderUsername);
  if (!senderSocket || senderSocket.readyState !== WebSocket.OPEN) return;

  let tournamentID: string = "";
  // add player to the tournament
  for (const [username, tournament] of currentTournaments.entries()) {
    if(pong_data.gameId === tournament.getUniqeID() 
      && tournament.playerCanJoin(senderUsername, pong_data.OpponentAlias)) {
      tournament.addPlayer(senderUsername, pong_data.OpponentAlias, senderSocket)
      // console.log("current players->>>",tournament.getCurrentPlayers())
      // opponent = username;
      tournamentID = tournament.getUniqeID();
      break;
    }
  }
  const response = {
      target_endpoint: 'pong-api',
      type: 'game_created',
      gameId: tournamentID
  };
  senderSocket.send(JSON.stringify(response));
  // check if tournament has 4 players and start 2 pong instances and make the game running
  for (const [username, tournament] of currentTournaments.entries()) {
    if(tournament.readyToStart()){
      tournament.start();
      break;
    }
  }
}

export function handleCreateTournament(senderUsername: string, pong_data: CreateGameData): void {
  // create tournament
  const uniqueGameID = `${senderUsername}-Tournament-${Date.now()}`;
  const newTournament = new Tournament(uniqueGameID, senderUsername, pong_data.playerAlias);

  // add tournament to list
  currentTournaments.set(senderUsername, newTournament);

  const senderSocket = getPongSocket(senderUsername);
    if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
      const response = {
        target_endpoint: 'pong-api',
        type: 'game_created',
        gameId: uniqueGameID
      };
      senderSocket.send(JSON.stringify(response));
    }
}
