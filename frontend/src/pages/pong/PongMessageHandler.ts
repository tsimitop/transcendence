
import { setGameRunning } from "./PongMenu";
import { GameStateData } from "./PongGame";
import { GameOverData } from "./PongGame";
import DOMPurify from 'dompurify';

let isInTournament = false;

export function resetTournamentState() {
  isInTournament = false;
}

export function     handlePongMessage(data: any, socket: WebSocket | null ) {
    if (!data.type) {
      console.error("Received message without type");
      return;
    }
    switch (data.type) {
      case 'game_over':
        handleGameOver(data.pong_data);
        break;
      case 'game_state':
        handleGameState(data);
        break;
      case 'countdown':
        handleCountdownGame(data);
        break;
      case 'game_created':
        handleGameCreated(data);
        break;
      case 'game_list':
        handleListGames(data, socket);
        break;  
      case 'tournament_list':
        handleListTournaments(data, socket);
        break;  
      case 'tournament_end':
        handleTournamentEnd(data.value);
        break;
      default:
        console.warn("Unknown message type:", data.type);
        break;
    }
  }

  export function handleGameCreated(data: any) {
    if (data.gameId && data.gameId.includes('Tournament')) {
      isInTournament = true;
    }
    handleWaitingForUser();
  }

  export function handleGameOver(data: GameOverData) {
    setGameRunning(false);
    // console.log(data);
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.warn("Canvas element not found - user may have navigated away");
      return;
    }
    // Hide all UI screens
    document.querySelectorAll(".screen").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    // Show canvas
    canvas.style.display = "block";
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;


    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context not available");
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
  
    const scoreText = `${data.finalScore.left} : ${data.finalScore.right}`;
    ctx.fillText(scoreText, canvas.width / 2, canvas.height / 2 - 20);
  
    ctx.font = "20px Arial";
    ctx.fillText(data.message, canvas.width / 2, canvas.height / 2 + 20);
  
    setTimeout(() => {
      if (isInTournament) {
        handleTournamentWaiting();
      } else {
        const menu = document.getElementById('menuScreen');
        const gameCanvas = document.getElementById('gameCanvas');

        if (gameCanvas) {
          gameCanvas.style.display = 'none'; // Hide the game canvas
        }

        if (menu) {
          menu.style.display = 'flex'; // Show menu screen
        }
      }
    }, 5000);
    
  }

  
  export function   handleGameState(data: any) {
	// fixes window for tournament = Viewport reset
	window.scrollTo(0, 0);

    // console.log(data);
    const gameStateData = data as GameStateData;
    const game = gameStateData.game;

    if(game.status === "finished") { return; }

    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.warn("Canvas element not found - user may have navigated away");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    document.querySelectorAll(".screen").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    canvas.style.display = "block";
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // Ball
    const ballX = game.ball.x * canvas.width;
    const ballY = game.ball.y * canvas.height;
    const ballRadius = canvas.width * 0.01;
    ctx.beginPath();
    ctx.fillStyle = "green";
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Left paddle
    ctx.fillStyle = "white";
    const lp = game.leftPaddle;
    ctx.fillRect(
      lp.topPoint.x * canvas.width,
      lp.topPoint.y * canvas.height,
      canvas.width * 0.01,              // take from backend???? 
      canvas.height * lp.height
    );

    // Right paddle
    const rp = game.rightPaddle;
    ctx.fillRect(
      rp.topPoint.x * canvas.width,
      rp.topPoint.y * canvas.height,
      canvas.width * 0.01,
      canvas.height * rp.height
    );
    
    const scoreText = game.scores
    .map(({ alias, score }) => `${DOMPurify.sanitize(alias || "")}: ${score}`)
    .join("   ");

    ctx.fillText(`${scoreText}`, canvas.width / 2, 30);

  }


  export function handleCountdownGame(data: any) {
    setGameRunning(true);
    // console.log("countdown data",data);
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.warn("Canvas element not found - user may have navigated away");
      return;
    }
    // Hide all UI screens
    document.querySelectorAll(".screen").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    // Show canvas
    canvas.style.display = "block";
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");
  
    let countdown = data.value;
  
    const drawCountdown = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "72px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(countdown), canvas.width / 2, canvas.height / 2);
    };
  
    drawCountdown();
  
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText("GO!", canvas.width / 2, canvas.height / 2);
        setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 1000);
      } else {
        drawCountdown();
      }
    }, 1000);
  }


export function handleWaitingForUser() {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.warn("Canvas element not found - user may have navigated away");
      return;
    }
    // Hide all UI screens
    document.querySelectorAll(".screen").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    canvas.style.display = "block";
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    const drawWaiting = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "16px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"
      ctx.fillText("Waiting for players...", canvas.width / 2, canvas.height / 2);
    };

    drawWaiting();
  }

  export function handleTournamentWaiting() {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.warn("Canvas element not found - user may have navigated away");
      return;
    }
    // Hide all UI screens
    document.querySelectorAll(".screen").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    canvas.style.display = "block";
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    const drawWaiting = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "24px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Tournament in progress...", canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = "18px Arial";
      ctx.fillText("Waiting for other match to complete", canvas.width / 2, canvas.height / 2 + 10);
    };

    drawWaiting();
  }

  export function handleListGames(data: any, socket: WebSocket | null) {
  const aliasInput = document.getElementById('JoinAliasInput') as HTMLInputElement;
  const alias = aliasInput.value.trim();
  localStorage.setItem('pong_alias', alias);

  const container = document.getElementById('availableGamesList');
  if (!container) {
    console.error("No container element found for availableGamesList");
    return;
  }
  container.innerHTML = '';

  if (!data.games || data.games.length === 0) {
    container.textContent = 'No available games right now.';
    return;
  }

  const ul = document.createElement('ul');

  data.games.forEach((game: { id: string; owner: string; alias: string; state: string }) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center mb-2';

    // Container for game info text
    const infoDiv = document.createElement('div');
    // Add flex container for info spans
    infoDiv.className = 'flex space-x-4';

    // Create spans for each game property
    const idSpan = document.createElement('span');
    idSpan.textContent = `Game ID: ${game.id}`;

    const ownerSpan = document.createElement('span');
    ownerSpan.textContent = `Creator: ${DOMPurify.sanitize(game.owner || "")}`;

    const aliasSpan = document.createElement('span');
    aliasSpan.textContent = `Alias: ${DOMPurify.sanitize(game.alias || "")}`;

    const stateSpan = document.createElement('span');
    stateSpan.textContent = `State: ${DOMPurify.sanitize(game.state || "")}`;

    // Append spans to infoDiv
    infoDiv.appendChild(idSpan);
    infoDiv.appendChild(ownerSpan);
    infoDiv.appendChild(aliasSpan);
    infoDiv.appendChild(stateSpan);

    // Create Join button
    const joinBtn = document.createElement('button');
    joinBtn.textContent = 'Join';
    joinBtn.disabled = game.state !== 'waiting';

    // Tailwind CSS classes for the button
    joinBtn.className = `
      border-2 border-blue-500
      bg-white text-blue-500
      px-3 py-1.5
      rounded
      cursor-pointer
      ml-4          /* <-- Add this */
      disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed
      hover:bg-blue-500 hover:text-white disabled:hover:bg-white disabled:hover:text-gray-300
    `.replace(/\s+/g, ' ').trim();

    //join after game started -> game list - maybe delay response after clicking
    const storedAlias = localStorage.getItem('pong_alias');
    joinBtn.addEventListener('click', () => {
      const joinRequest = {
        target_endpoint: 'pong-api',
        payload: {
          type: 'join_game',
          pong_data: {
            OpponentAlias: storedAlias,
            gameId: game.id
          }
        }
      };
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(joinRequest));
      } else {
        console.error("Socket is not open");
      }
    });

    // Append info and button to list item
    li.appendChild(infoDiv);
    li.appendChild(joinBtn);

    ul.appendChild(li);
  });

  container.appendChild(ul);
}

  
  export function handleListTournaments(data: any, socket: WebSocket | null) {
    console.log("handleListTournaments frontend");
    const aliasInput = document.getElementById('JoinAliasInput2') as HTMLInputElement;
    const alias = aliasInput.value.trim();
    localStorage.setItem('pong_alias', alias);

    const container = document.getElementById('availableTournamentList');
    if (!container) {
      console.error("No container element found for availableTournamentList");
      return;
    }
    container.innerHTML = '';

    if (!data.games || data.games.length === 0) {
      container.textContent = 'No available tournaments right now.';
      return;
    }
  
    const ul = document.createElement('ul');

    data.games.forEach((game: { id: string; owner: string; alias: string; state: string }) => {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center mb-2';

      // Container for game info text
      const infoDiv = document.createElement('div');
      // Add flex container for info spans
      infoDiv.className = 'flex space-x-4';

      // Create spans for each game property
      const idSpan = document.createElement('span');
      idSpan.textContent = `Game ID: ${game.id}`;

      const ownerSpan = document.createElement('span');
      ownerSpan.textContent = `Creator: ${DOMPurify.sanitize(game.owner || "")}`;

      const aliasSpan = document.createElement('span');
      aliasSpan.textContent = `Alias: ${DOMPurify.sanitize(game.alias || "")}`;

      const stateSpan = document.createElement('span');
      stateSpan.textContent = `State: ${DOMPurify.sanitize(game.state || "")}`;
  
      // Append spans to infoDiv
      infoDiv.appendChild(idSpan);
      infoDiv.appendChild(ownerSpan);
      infoDiv.appendChild(aliasSpan);
      infoDiv.appendChild(stateSpan);
  
      // Create Join button
      const joinBtn = document.createElement('button');
      joinBtn.textContent = 'Join';
      joinBtn.disabled = game.state !== 'waiting';
  
      // Tailwind CSS classes for the button
      joinBtn.className = `
        border-2 border-blue-500
        bg-white text-blue-500
        px-3 py-1.5
        rounded
        cursor-pointer
        ml-4          /* <-- Add this */
        disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed
        hover:bg-blue-500 hover:text-white disabled:hover:bg-white disabled:hover:text-gray-300
      `.replace(/\s+/g, ' ').trim();
  
      //join after game started -> game list - maybe delay response after clicking
      joinBtn.addEventListener('click', () => {
		const storedAlias = localStorage.getItem('pong_alias');
		  if (!storedAlias) {
			alert("Alias not found. Please enter a valid alias.");
			return;
		  }
		const aliases = Array.from(document.querySelectorAll('#availableTournamentList span'))
		  .filter(span => span.textContent?.startsWith('Alias:'))
		  .map(span => span.textContent?.replace('Alias:', '').trim());

		if (aliases.includes(storedAlias)) {
		  alert("This alias is already taken. Please choose another one.");
		  return;
		}
        const joinRequest = {
          target_endpoint: 'pong-api',
          payload: {
            type: 'join_tournament',
            pong_data: {
              OpponentAlias: storedAlias,
              gameId: game.id
            }
          }
        };
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(joinRequest));
        } else {
          console.error("Socket is not open");
        }
      });

    li.appendChild(infoDiv);
    li.appendChild(joinBtn);
    ul.appendChild(li); 
    });
    container.appendChild(ul);
  }

export function handleTournamentEnd(message: string) {
	isInTournament = false;
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas) {
		console.warn("Canvas element not found - user may have navigated away");
		return;
	}

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.font = "28px Arial";
	ctx.fillStyle = "gold";
	ctx.textAlign = "center";
	ctx.fillText("Tournament Over!", canvas.width / 2, canvas.height / 2 - 30);

	ctx.font = "22px Arial";
	ctx.fillStyle = "white";
	const safeMessage = DOMPurify.sanitize(message || "");
	ctx.fillText(safeMessage, canvas.width / 2, canvas.height / 2 + 10);

  setTimeout(() => {
	  const menu = document.getElementById("menuScreen");
	  if (menu) menu.style.display = "flex";
	  canvas.style.display = "none";
	}, 6000);
}
