export function getPongHTML(theme: string): string {
  return `
  <!-- ***************************************** -->
  <!-- *************  SCRIPT  ****************** -->
  <!-- ***************************************** -->

  <script>
    // Prevent scrolling with arrow keys and space
    window.addEventListener("keydown", function (e) {
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
    }, false);
  </script>

  <!-- ***************************************** -->
  <!-- *************  MAIN  ******************** -->
  <!-- ***************************************** -->

<main class="relative w-full h-screen bg-black text-white select-none theme-primary-${theme}-full flex flex-col items-center justify-start p-6">

    <!-- Menu -->
    <div id="menuScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12">
      <h2 class="text-3xl font-semibold">Select Game Mode</h2>
      <button id="LocalGameButton" class="btn-primary">Local 1 vs 1</button>
      <button id="RemoteGameButton" class="btn-primary">Create Remote 1 vs 1</button>
      <button id="JoinButton" class="btn-primary">Join Remote 1 vs 1</button>
      <button id="RemoteTournamentButton" class="btn-primary">Create Remote Tournament</button>
      <button id="JoinTournamentButton" class="btn-primary">Join Remote Tournament</button>
    </div>

    <!-- LocalGameSettings -->
    <div id="LocalGameSettings" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12">
      <h2 class="text-2xl font-semibold">Enter Player Name</h2>
      <input id="player1Input" placeholder="Player 1 alias" class="input-primary" />
      <input id="player2Input" placeholder="Player 2 alias" class="input-primary hidden" />
      <button id="startLocalGameBtn" class="btn-green">Start Game</button>
      <button id="backLocalGameSettingsBtn" class="btn-secondary">Back</button>
    </div>

    <!-- Remote Option -->
    <div id="remoteOptionScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12">
      <h2 class="text-2xl font-semibold">Remote Game Options</h2>
      <input id="remoteAliasInput" placeholder="Your alias" class="input-primary" />
      <button id="createRemoteGameBtn" class="btn-green">Create New Game</button>
      <button id="backFromRemoteOptionsBtn" class="btn-secondary">Back</button>
    </div>

    <!-- Join Game Alias Entry -->
    <div id="joinAliasScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12">
      <h2 class="text-2xl font-semibold">Join Remote Game</h2>
      <input id="JoinAliasInput" placeholder="Your alias" class="input-primary" />
      <button id="joinRemoteGamePageBtn" class="btn-primary">Continue</button>
      <button id="backFromJoinOptionsBtn" class="btn-secondary">Back</button>
    </div>

    <!-- Game List Page -->
    <div id="gameListScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12 w-full max-w-xl px-4">
      <h2 class="text-2xl font-semibold">Available Games</h2>
      <div id="availableGamesList" class="text-center text-gray-300 mb-4">Loading...</div>
      <button id="backFromGameListBtn" class="btn-secondary self-center">Back</button>
    </div>


    <!-- Remote Tournament Option -->
    <div id="remoteTournamentOptionScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12">
      <h2 class="text-2xl font-semibold">Remote Tournament Options</h2>
      <input id="remoteTournamentAliasInput" placeholder="Your alias" class="input-primary" />
      <button id="createRemoteTournamentBtn" class="btn-green">Create New Tournament</button>
      <button id="backFromTournamentRemoteOptionsBtn" class="btn-secondary">Back</button>
    </div>

    <!-- Join Game Tournament Alias Entry -->
    <div id="joinTournamentAliasScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12">
      <h2 class="text-2xl font-semibold">Join Remote Tournament</h2>
      <input id="JoinAliasInput2" placeholder="Your alias" class="input-primary" />
      <button id="joinRemoteTournamentGamePageBtn" class="btn-primary">Continue</button>
      <button id="backFromJoinTournamentOptionsBtn" class="btn-secondary">Back</button>
    </div>

    <!-- Tournament List Page -->
    <div id="tournamentListScreen" class="screen hidden flex flex-col items-center justify-center gap-4 mt-12 w-full max-w-xl px-4">
      <h2 class="text-2xl font-semibold">Available Tournaments</h2>
      <div id="availableTournamentList" class="text-center text-gray-300 mb-4">Loading...</div>
      <button id="backFromTournamentListBtn" class="btn-secondary self-center">Back</button>
    </div>



    <!-- Game Canvas -->
    <canvas id="gameCanvas" class="screen hidden border border-black bg-black w-full max-w-3xl max-h-[700px] min-w-[200px] min-h-[400px] mx-auto h-auto"></canvas>

  </main>

  <style>
    .btn-primary {
      @apply px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400;
    }
    .btn-green {
      @apply px-6 py-3 rounded bg-green-600 hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400;
    }
    .btn-secondary {
      @apply px-6 py-3 rounded bg-gray-600 hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-400;
    }
    .input-primary {
      @apply px-4 py-2 rounded border border-gray-400 text-black w-64 focus:outline-none focus:ring-2 focus:ring-blue-400;
    }
  </style>
  `;
}
