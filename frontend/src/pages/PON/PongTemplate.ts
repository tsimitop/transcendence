export function getPongHTML(theme: string): string {
  return `
    <main class="main-container layout-padding theme-primary-${theme}-full">
      <style>
        canvas {
          border: 1px solid black;
          background: rgb(0, 0, 0);
          display: none;
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
      </style>

      <!-- Menu -->
      <div id="menuScreen" class="screen">
        <h2>Select Game Mode</h2>
        <button id="localPlayBtn">Local Play</button>
        <button id="remotePlayBtn">Remote Play</button>
      </div>

      <!-- Remote Option -->
      <div id="remoteOptionScreen" class="screen">
        <h2>Remote Game Options</h2>
        <button id="createGameBtn">Create New Game</button>
        <button id="joinGamePageBtn">Join Existing Game</button>
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
          Max Players:
          <select id="maxPlayersSelect">
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
        </label>
        <label>
          Game Visibility:
          <select id="visibilitySelect">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button id="confirmCreateBtn">Next</button>
      </div>

      <!-- Alias Entry -->
      <div id="aliasScreen" class="screen">
        <h2>Enter Player Name</h2>
        <input id="player1Input" placeholder="Your alias" />
        <input id="player2Input" placeholder="Player 2 alias" style="display: none;" />
        <button id="startGameBtn">Start Game</button>
      </div>

      <!-- Game Canvas -->
      <canvas id="gameCanvas" width="800" height="600"></canvas>
    </main>
  `;
}
