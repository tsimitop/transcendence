export function getPongHTML(theme: string): string {
  return `
  
  <!-- ***************************************** -->
  <!-- *************    STYLE  ***************** -->
  <!-- ***************************************** -->
<style>
body, html {
  overflow: hidden; /* prevents scrolling completely */
  height: 100%;
}
canvas {
  border: 1px solid black;
  background: rgb(0, 0, 0);
  display: none;
  width: 80%;
  min-width: 200px;
  margin: auto;
  min-height: 400px;
  max-height: 1200px;
  height: 100%;
}


@media only screen and (max-width: 600px) {
  canvas {
    width: 98%;
  }
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



<!-- ***************************************** -->
<!-- *************  SCRIPT  ****************** -->
<!-- ***************************************** -->

<script>
  // This works reliably in all modern browsers
  window.addEventListener("keydown", function (e) {
    if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
      e.preventDefault();
    }
  }, false); // passive: false is the default here
</script>


<!-- ***************************************** -->
<!-- *************  MAIN  ******************** -->
<!-- ***************************************** -->


    <main class="main-container layout-padding theme-primary-${theme}-full">
      <!-- Menu -->
      <div id="menuScreen" class="screen">
        <h2>Select Game Mode</h2>
        <button id="LocalGameButton">Local 1 vs 1</button>
        <button id="RemoteGameButton">Remote 1 vs 1</button>
        <button id="RemoteTournamentButton">Remote Tournament</button>
        <button id="JoinButton">Join Game</button>
      </div>

      <!-- Remote Option -->
      <div id="remoteOptionScreen" class="screen">
        <h2>Remote Game Options</h2>
        <input id="remoteAliasInput" placeholder="Your alias" />
        <button id="createRemoteGameBtn">Create New Game</button>
        <button id="backFromRemoteOptionsBtn">Back</button>
      </div>

      
      
      <!-- Remote Tournament Option -->
      <div id="remoteTournamentOptionScreen" class="screen">
      <h2>Remote Game Options</h2>
      <input id="remoteTournamentAliasInput" placeholder="Your alias" />
      <button id="createRemoteTournamentGameBtn">Create New Game</button>
      <button id="backFromRemoteTournamentOptionsBtn">Back</button>
      </div>
      

      <!-- Join Game Alias Entry -->
      <div id="joinAliasScreen" class="screen">
        <h2>Join Remote Game</h2>
        <input id="JoinAliasInput" placeholder="Your alias" />
        <button id="joinRemoteGamePageBtn">Continue</button>
        <button id="backFromJoinOptionsBtn">Back</button>
      </div>

      <!-- Game List Page -->
      <div id="gameListScreen" class="screen">
        <h2>Available Games</h2>
        <div id="availableGamesList">Loading...</div>
        <button id="backFromGameListBtn">Back</button>
      </div>


      <!-- -------------------------------------------------------------------delete -->
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
      <!-- -------------------------------------------------------------------delete -->




      <!-- LocalGameSettings -->
      <div id="LocalGameSettings" class="screen">
        <h2>Enter Player Name</h2>
        <input id="player1Input" placeholder="Player 1 alias" />
        <input id="player2Input" placeholder="Player 2 alias" style="display: none;" />
        <button id="startLocalGameBtn">Start Game</button>
        <button id="backLocalGameSettingsBtn">Back</button>
      </div>

      <!-- Game Canvas -->
      <canvas id="gameCanvas"></canvas>
    </main>
  `;
}

