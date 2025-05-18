import { Pong } from "../Pong";

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
  const backFromRemoteOptionsBtn = get('backFromRemoteOptionsBtn');
  const backFromCreateSettingsBtn = get('backFromCreateSettingsBtn');
  const backFromGameListBtn = get('backFromGameListBtn');
  const backFromAliasBtn = get('backFromAliasBtn');
  const createGameConfirmBtn = get('createGameConfirmBtn');
  const startBtn = get('startGameBtn');

  const maxPlayersSelect = get('maxPlayersSelect') as HTMLSelectElement;
  const alias1Input = get('player1Input') as HTMLInputElement;
  const alias2Input = get('player2Input') as HTMLInputElement;
  const remoteAliasInput = get('remoteAliasInput') as HTMLInputElement;

  let selectedMode: 'local' | 'remote' = 'local';
  let remoteSubmode: 'create' | 'join' | null = null;

  showOnly(menu, 'menuScreen');

  localBtn.onclick = () => {
    selectedMode = 'local';
    showOnly(alias, 'aliasScreen');
    alias2Input.style.display = 'block';
  };

  remoteBtn.onclick = () => {
    selectedMode = 'remote';
    showOnly(remoteOptions, 'remoteOptionScreen');
  };

  createGameBtn.onclick = () => {
    remoteSubmode = 'create';
    showOnly(createSettings, 'createSettingsScreen');
  };

  createGameConfirmBtn.onclick = () => {
    const alias1 = remoteAliasInput.value.trim();
    const maxPlayers = parseInt(maxPlayersSelect.value);

    if (!alias1) {
      alert("Please enter your alias");
      return;
    }

    showOnly(canvas, 'gameCanvas');
    canvas.style.display = 'block';

    pong.socket?.send(JSON.stringify({
      target_endpoint: 'pong-api',
      payload: {
        type: 'create_game',
        mode: 'remote',
        alias: alias1,
        maxPlayers
      }
    }));
  };

  joinGamePageBtn.onclick = () => {
    remoteSubmode = 'join';
    const alias1 = remoteAliasInput.value.trim();
    if (!alias1) {
      alert("Please enter your alias");
      return;
    }
    (window as any)._joinAlias = alias1;
    showOnly(gameList);
    loadAvailableGames();
  };

  startBtn.onclick = () => {
    const alias1 = alias1Input.value.trim();
    const alias2 = alias2Input.value.trim();

    if (!alias1 || (selectedMode === 'local' && !alias2)) {
      alert("Please enter required aliases");
      return;
    }

    if (selectedMode === 'local') {
      showOnly(canvas, 'gameCanvas');
      canvas.style.display = 'block';

      pong.socket?.send(JSON.stringify({
        target_endpoint: 'pong-api',
        payload: {
          type: 'create_game',
          mode: 'local',
          players: [alias1, alias2]
        }
      }));
    }
  };

  backFromGameListBtn.onclick = () => showOnly(remoteOptions);
  backFromRemoteOptionsBtn.onclick = () => showOnly(menu);
  backFromCreateSettingsBtn.onclick = () => showOnly(remoteOptions);
  backFromAliasBtn.onclick = () => showOnly(menu);

  window.addEventListener('popstate', (event) => {
    const state = event.state;
    const screenId = state?.screen || 'menuScreen';
    const elem = document.getElementById(screenId);
    if (elem) {
      showOnly(elem, screenId, false); // false = do NOT push to history again
    }
  });
  
  
  function showOnly(elem: HTMLElement, stateName: string = elem.id, pushToHistory: boolean = true) {
    document.querySelectorAll('.screen').forEach(div => {
      (div as HTMLElement).style.display = 'none';
    });
    elem.style.display = 'flex';
  
    // Only push to history if this isn't triggered by a popstate event
    if (pushToHistory && location.hash !== `#${stateName}`) {
      history.pushState({ screen: stateName }, "", `#${stateName}`);
    }
  }
  
  

  function loadAvailableGames() {
    pong.socket?.send(JSON.stringify({ type: 'list_games' }));
  }
}
