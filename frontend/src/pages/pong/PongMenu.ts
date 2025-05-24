import { Pong } from "../Pong";

export function setupMenu(pong: Pong) {
  const get = (id: string) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element with id "${id}" not found`);
    return el;
  };
  
  const menu = get('menuScreen');
  const remoteOptions = get('remoteOptionScreen');
  const remoteTournamentOption = get('remoteTournamentOptionScreen');
  const gameList = get('gameListScreen');
  const LocalGameSettings = get('LocalGameSettings');
  const gameCanvas = get('gameCanvas');

  const LocalGameButton = get('LocalGameButton');
  const RemoteGameButton = get('RemoteGameButton');
  const RemoteTournamentButton = get('RemoteTournamentButton');
  const JoinButton = get('JoinButton');

  const createRemoteGameBtn = get('createRemoteGameBtn');
  const createRemoteTournamentGameBtn = get('createRemoteTournamentGameBtn');

  const joinRemoteGamePageBtn = get('joinRemoteGamePageBtn');

  const backFromRemoteOptionsBtn = get('backFromRemoteOptionsBtn');
  const backFromTournamentRemoteOptionsBtn = get('backFromRemoteTournamentOptionsBtn');
  const backFromGameListBtn = get('backFromGameListBtn');
  const backLocalGameSettingsBtn = get('backLocalGameSettingsBtn');
  const backFromJoinOptionsBtn = get('backFromJoinOptionsBtn');
  const startLocalGameBtn = get('startLocalGameBtn');

  const alias1Input = get('player1Input') as HTMLInputElement;
  const alias2Input = get('player2Input') as HTMLInputElement;
  const remoteAliasInput = get('remoteAliasInput') as HTMLInputElement;
  const remoteTournamentAliasInput = get('remoteTournamentAliasInput') as HTMLInputElement;
  const JoinAliasInput = get('JoinAliasInput') as HTMLInputElement;

  let selectedMode: 'local' | 'remote' = 'local';
  let remoteSubmode: 'create' | 'join' | null = null;

  showOnly(menu, 'menuScreen');

  LocalGameButton.onclick = () => {
    selectedMode = 'local';
    showOnly(LocalGameSettings, 'LocalGameSettings');
    alias2Input.style.display = 'block';
  };

  RemoteGameButton.onclick = () => {
    selectedMode = 'remote';
    showOnly(remoteOptions, 'remoteOptionScreen');
  };

  RemoteTournamentButton.onclick = () => {
    selectedMode = 'remote';
    showOnly(remoteTournamentOption, 'remoteTournamentOptionScreen');
  };

  JoinButton.onclick = () => {
    selectedMode = 'remote';
    showOnly(get('joinAliasScreen'), 'joinAliasScreen');
  };

  joinRemoteGamePageBtn.onclick = () => {
    remoteSubmode = 'join';
    const alias1 = JoinAliasInput.value.trim();
    if (!alias1) {
      alert("Please enter your alias");
      return;
    }
    (window as any)._joinAlias = alias1;

    showOnly(gameList, 'gameListScreen');
    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'game_list'
      }
    }));
  };


  createRemoteTournamentGameBtn.onclick = () => {
    remoteSubmode = 'create';
    // showOnly(createSettings, 'createSettingsScreen');
    const alias1 = remoteTournamentAliasInput.value.trim();
    if (!alias1) {
      alert("Please enter your alias");
      return;
    }

    showOnly(gameCanvas, 'gameCanvas');
    gameCanvas.style.display = 'block';

    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'create_game',
        pong_data : {
          playerAlias: alias1,
          gameMode: 'remote',
          localOpponent: "" ,
          amountPlayers: 4,
          tournament: true,          
        }
      }
    }));
    
  };

  createRemoteGameBtn.onclick = () => {
    remoteSubmode = 'create';
    // showOnly(createSettings, 'createSettingsScreen');
    const alias1 = remoteAliasInput.value.trim();
    if (!alias1) {
      alert("Please enter your alias");
      return;
    }

    showOnly(gameCanvas, 'gameCanvas');
    gameCanvas.style.display = 'block';

    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'create_game',
        pong_data : {
          playerAlias: alias1,
          gameMode: 'remote',
          localOpponent: "" ,
          amountPlayers: 2,
          tournament: false,          
        }
      }
    }));
    
  };


let gameListInterval: number | undefined;

  joinRemoteGamePageBtn.onclick = () => {
    remoteSubmode = 'join';
    const alias1 = JoinAliasInput.value.trim();
    if (!alias1) {
      alert("Please enter your alias");
      return;
    }
    (window as any)._joinAlias = alias1;
    showOnly(gameList);
    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'game_list'
      }
    }));
  // Start polling every 5 seconds
  gameListInterval = window.setInterval(() => {
    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'game_list'
      }
    }));
  }, 5000); // every 5 seconds
  };

  startLocalGameBtn.onclick = () => {
    const alias1 = alias1Input.value.trim();
    const alias2 = alias2Input.value.trim();

    if (!alias1 || (selectedMode === 'local' && !alias2)) {
      alert("Please enter required aliases");
      return;
    }

    if (selectedMode === 'local') {
      showOnly(gameCanvas, 'gameCanvas');
      gameCanvas.style.display = 'block';

      pong.socket?.send(JSON.stringify({
        target_endpoint: 'pong-api',
        payload: {
          type: 'create_game',
          pong_data : {
            playerAlias: alias1,
            gameMode: 'local',
            localOpponent: alias2,
            amountPlayers: 2,
            tournament: false,
          }
        }
      }));
    }
  };

  backFromGameListBtn.onclick = () => showOnly(remoteOptions);
  backFromRemoteOptionsBtn.onclick = () => showOnly(menu);
  backFromJoinOptionsBtn.onclick = () => showOnly(menu);
  backFromTournamentRemoteOptionsBtn.onclick = () => showOnly(menu);
  backLocalGameSettingsBtn.onclick = () => showOnly(menu);

  window.addEventListener('popstate', (event) => {
    const state = event.state;
    const screenId = state?.screen || 'menuScreen';
    const elem = document.getElementById(screenId);
    if (!elem) {
      console.error("showOnly: element with id 'some-id' not found");
      return;
    }
    if (elem) {
      showOnly(elem, screenId, false); // false = do NOT push to history again
    }
  });
}


export function showOnly(elem: HTMLElement, stateName: string = elem.id, pushToHistory: boolean = true) {
  document.querySelectorAll('.screen').forEach(div => {
    (div as HTMLElement).style.display = 'none';
  });
    elem.style.display = elem.tagName === 'CANVAS' ? 'block' : 'flex';
  // elem.style.display = 'flex';

  // Only push to history if this isn't triggered by a popstate event
  if (pushToHistory && location.hash !== `#${stateName}`) {
    history.pushState({ screen: stateName }, "", `#${stateName}`);
  }
}
