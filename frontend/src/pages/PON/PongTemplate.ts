export function getPongHTML(theme: string): string {
  return `
    <main class="main-container layout-padding theme-primary-${theme}-full">
<style>
  canvas {
    border: 1px solid black;
    background: rgb(0, 0, 0);
    display: none;

    /* ✅ Centering canvas */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .screen {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 3rem;
  }

  .screen input, .screen select {
    padding: 0.5rem;
    font-size: 1rem;
  }

  .screen button {
    font-size: 1.1rem;
    padding: 0.6rem 1.5rem;
  }

  /* ✅ Ensure body fills the whole viewport */
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }

  main.main-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>


      <!-- Menu -->
      <div id="menuScreen" class="screen">
        <h2>Select Game Mode</h2>
        <button id="LocalGameButton">Local</button>
        <button id="RemoteGameButton">Remote</button>
      </div>

      <!-- Remote Option -->
      <div id="remoteOptionScreen" class="screen">
        <h2>Remote Game Options</h2>
        <input id="remoteAliasInput" placeholder="Your alias" />
        <button id="createRemoteGameBtn">Create New Game</button>
        <button id="joinRemoteGamePageBtn">Join Existing Game</button>
        <button id="backFromRemoteOptionsBtn">Back</button>
      </div>

      <!-- Game List Page -->
      <div id="gameListScreen" class="screen">
        <h2>Available Games</h2>
        <div id="availableGamesList">Loading...</div>
        <button id="backFromGameListBtn">Back</button>
      </div>

      <!-- Create Game Settings -->
      <div id="createSettingsScreen" class="screen">
        <h2>Game Settings</h2>
        <label>
          Mode:
          <select id="MultiplayerModeSelect">
            <option value="VS">VS</option>
            <option value="Tournament">Tournament</option>
          </select>
        </label>
        <label>
          Max Players:
          <select id="MultiplayerMaxPlayersSelect">
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
        </label>
        <button id="createRemoteGameConfirmBtn">Create Game</button>
        <button id="backFromCreateSettingsBtn">Back</button>
      </div>

      <!-- LocalGameSettings -->
      <div id="LocalGameSettings" class="screen">
        <h2>Enter Player Name</h2>
        <input id="player1Input" placeholder="Player 1 alias" />
        <input id="player2Input" placeholder="Player 2 alias" style="display: none;" />
        <button id="startLocalGameBtn">Start Game</button>
        <button id="backLocalGameSettingsBtn">Back</button>
      </div>

      <!-- Game Canvas -->
      <canvas id="gameCanvas" width="800" height="600"></canvas>
    </main>
  `;
}
