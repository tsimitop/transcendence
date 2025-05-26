import { Pong } from "../Pong";

export let gameIsRunning = false;
export function setGameRunning(value: boolean) {
  gameIsRunning = value;
}

export function setupMenu(pong: Pong) {
  // Helper to get element by id or throw
  const get = (id: string): HTMLElement => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element with id "${id}" not found`);
    return el;
  };

  // Elements
  const menu = get('menuScreen');
  const remoteOptions = get('remoteOptionScreen');
  const remoteTournamentOption = get('remoteTournamentOptionScreen');
  const gameList = get('gameListScreen');
  const localGameSettings = get('LocalGameSettings');
  const gameCanvas = get('gameCanvas');

  const LocalGameButton = get('LocalGameButton');
  const RemoteGameButton = get('RemoteGameButton');
  const RemoteTournamentButton = get('RemoteTournamentButton');
  const JoinButton = get('JoinButton');
  const JoinTournamentButton = get('JoinTournamentButton');

  const createRemoteGameBtn = get('createRemoteGameBtn');
  const createRemoteTournamentGameBtn = get('createRemoteTournamentGameBtn');

  const joinRemoteGamePageBtn = get('joinRemoteGamePageBtn');
  const joinRemoteTournamentGamePageBtn = get('joinRemoteTournamentGamePageBtn');

  const backFromRemoteOptionsBtn = get('backFromRemoteOptionsBtn');
  const backFromTournamentRemoteOptionsBtn = get('backFromRemoteTournamentOptionsBtn');
  const backFromGameListBtn = get('backFromGameListBtn');
  const backLocalGameSettingsBtn = get('backLocalGameSettingsBtn');
  const backFromJoinOptionsBtn = get('backFromJoinOptionsBtn');
  const backFromJoinTournamentOptionsBtn = get('backFromJoinTournamentOptionsBtn');
  const startLocalGameBtn = get('startLocalGameBtn');

  const alias1Input = get('player1Input') as HTMLInputElement;
  const alias2Input = get('player2Input') as HTMLInputElement;
  const remoteAliasInput = get('remoteAliasInput') as HTMLInputElement;
  const remoteTournamentAliasInput = get('remoteTournamentAliasInput') as HTMLInputElement;
  const JoinAliasInput = get('JoinAliasInput') as HTMLInputElement;
  const JoinAliasInput2 = get('JoinAliasInput2') as HTMLInputElement;

  // Track game list polling interval for clearing later
  let gameListInterval: number | undefined;

  // Function to show only one screen at a time
  function showOnly(elem: HTMLElement, stateName: string = elem.id, pushToHistory: boolean = true) {
    // Hide all screens by class 'screen' or all relevant containers
    document.querySelectorAll('main > div, canvas').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    // Show the chosen element
    elem.style.display = elem.tagName === 'CANVAS' ? 'block' : 'flex';

    if (pushToHistory && location.hash !== `#${stateName}`) {
      history.pushState({ screen: stateName }, "", `#${stateName}`);
    }
  }

  // Initial screen
  // showOnly(menu);
  if (!gameIsRunning) {
    showOnly(menu);
  } else {
    showOnly(gameCanvas); // or whichever screen should be visible during the game
  }

  // Menu button handlers
  LocalGameButton.onclick = () => {
    alias2Input.style.display = 'block';
    showOnly(localGameSettings);
  };

  RemoteGameButton.onclick = () => {
    showOnly(remoteOptions);
  };

  RemoteTournamentButton.onclick = () => {
    showOnly(remoteTournamentOption);
  };

  JoinButton.onclick = () => {
    showOnly(get('joinAliasScreen'));
  };

  JoinTournamentButton.onclick = () => {
    showOnly(get('joinTournamentAliasScreen'));
  };

  // Create remote game buttons
  createRemoteGameBtn.onclick = () => {
    const alias = remoteAliasInput.value.trim();
    if (!alias) return alert("Please enter your alias");

    showOnly(gameCanvas);
    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'create_game',
        pong_data: {
          playerAlias: alias,
          gameMode: 'remote',
          localOpponent: "",
          amountPlayers: 2,
          tournament: false,
        }
      }
    }));
  };

  createRemoteTournamentGameBtn.onclick = () => {
    const alias = remoteTournamentAliasInput.value.trim();
    if (!alias) return alert("Please enter your alias");

    showOnly(gameCanvas);
    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'create_tournament',
        pong_data: {
          playerAlias: alias,
          gameMode: 'remote',
          localOpponent: "",
          amountPlayers: 4,
          tournament: true,
        }
      }
    }));
  };

  // Join remote game buttons
  joinRemoteGamePageBtn.onclick = () => {
    const alias = JoinAliasInput.value.trim();
    if (!alias) return alert("Please enter your alias");
    (window as any)._joinAlias = alias;

    showOnly(gameList);
    pong.socket?.send(JSON.stringify({ target_endpoint: 'pong-api', payload: { type: 'game_list' } }));

    // Polling for game list every 5 seconds
    if (gameListInterval) clearInterval(gameListInterval);
    gameListInterval = window.setInterval(() => {
      pong.socket?.send(JSON.stringify({ target_endpoint: 'pong-api', payload: { type: 'game_list' } }));
    }, 5000);
  };

  joinRemoteTournamentGamePageBtn.onclick = () => {
    const alias = JoinAliasInput2.value.trim();
    if (!alias) return alert("Please enter your alias");
    (window as any)._joinAlias = alias;

    showOnly(gameList);
    pong.socket?.send(JSON.stringify({ target_endpoint: 'pong-api', payload: { type: 'tournament_list' } }));

    if (gameListInterval) clearInterval(gameListInterval);
    gameListInterval = window.setInterval(() => {
      pong.socket?.send(JSON.stringify({ target_endpoint: 'pong-api', payload: { type: 'game_list' } }));
    }, 5000);
  };

  // Start local game button
  startLocalGameBtn.onclick = () => {
    const alias1 = alias1Input.value.trim();
    const alias2 = alias2Input.value.trim();

    if (!alias1 || !alias2) {
      return alert("Please enter both player aliases");
    }

    showOnly(gameCanvas);

    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'create_game',
        pong_data: {
          playerAlias: alias1,
          gameMode: 'local',
          localOpponent: alias2,
          amountPlayers: 2,
          tournament: false,
        }
      }
    }));
  };

  // Back buttons
  backFromRemoteOptionsBtn.onclick = () => {
    showOnly(menu);
  };

  backFromTournamentRemoteOptionsBtn.onclick = () => {
    showOnly(menu);
  };

  backFromGameListBtn.onclick = () => {
    showOnly(remoteOptions);
    if (gameListInterval) clearInterval(gameListInterval);
  };

  backLocalGameSettingsBtn.onclick = () => {
    showOnly(menu);
  };

  backFromJoinOptionsBtn.onclick = () => {
    showOnly(menu);
  };

  backFromJoinTournamentOptionsBtn.onclick = () => {
    showOnly(menu);
  };

  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    const screenId = event.state?.screen || 'menuScreen';
    const elem = document.getElementById(screenId);
    if (elem) {
      showOnly(elem, screenId, false);
    }
  });
}
