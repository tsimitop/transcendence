export function setupMenu(pong: Pong) {
  const get = (id: string) => document.getElementById(id)!;

  const menu = get('menuScreen');
  const remoteOptions = get('remoteOptionScreen');
  const gameList = get('gameListScreen');
  const createSettings = get('createSettingsScreen');
  const alias = get('aliasScreen');
  const canvas = get('gameCanvas');

  const localBtn = get('localPlayBtn');
  const remoteBtn = get('remotePlayBtn');
  const createGameBtn = get('createGameBtn');
  const joinGamePageBtn = get('joinGamePageBtn');
  const confirmCreateBtn = get('confirmCreateBtn');
  const backFromGameListBtn = get('backFromGameListBtn');
  const startBtn = get('startGameBtn');

  const alias1Input = get('player1Input') as HTMLInputElement;
  const alias2Input = get('player2Input') as HTMLInputElement;

  let selectedMode: 'local' | 'remote' = 'local';
  let remoteSubmode: 'create' | 'join' | null = null;
  let createSettingsData = {};
  let joinGameId = '';

  showOnly(menu);

  localBtn.onclick = () => {
    selectedMode = 'local';
    showOnly(alias);
    alias2Input.style.display = 'block';
  };

  remoteBtn.onclick = () => {
    selectedMode = 'remote';
    showOnly(remoteOptions);
  };

  createGameBtn.onclick = () => {
    remoteSubmode = 'create';
    showOnly(createSettings);
  };

  confirmCreateBtn.onclick = () => {
    const maxPlayers = (get('maxPlayersSelect') as HTMLSelectElement).value;
    const visibility = (get('visibilitySelect') as HTMLSelectElement).value;
    createSettingsData = { maxPlayers, visibility };
    showOnly(alias);
    alias2Input.style.display = 'none';
  };

  joinGamePageBtn.onclick = () => {
    remoteSubmode = 'join';
    showOnly(gameList);
    loadAvailableGames();
  };

  backFromGameListBtn.onclick = () => {
    showOnly(remoteOptions);
  };

  startBtn.onclick = () => {
    const alias1 = alias1Input.value.trim();
    const alias2 = alias2Input.value.trim();

    if (!alias1 || (selectedMode === 'local' && !alias2)) {
      alert("Please enter required aliases");
      return;
    }

    showOnly(canvas);
    canvas.style.display = 'block';

    if (selectedMode === 'local') {
      pong.socket?.send(JSON.stringify({
        type: 'start_game',
        mode: 'local',
        players: [alias1, alias2]
      }));
    } else if (remoteSubmode === 'create') {
      pong.socket?.send(JSON.stringify({
        type: 'create_game',
        alias: alias1,
        settings: createSettingsData
      }));
    } else if (remoteSubmode === 'join') {
      pong.socket?.send(JSON.stringify({
        type: 'join_game',
        alias: alias1,
        gameId: joinGameId
      }));
    }

    pong.initializeGame();
  };

  function showOnly(elem: HTMLElement) {
    document.querySelectorAll('.screen').forEach(div => {
      (div as HTMLElement).style.display = 'none';
    });
    elem.style.display = 'flex';
  }

  function loadAvailableGames() {
    pong.socket?.send(JSON.stringify({ type: 'list_games' }));
  }

  // Optional: pong.socket.onmessage handler could listen for game list and render it into #availableGamesList
}
