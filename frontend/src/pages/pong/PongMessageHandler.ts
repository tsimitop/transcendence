
import { GameStateData } from "./PongGame";
import { GameOverData } from "./PongGame";
// import { showOnly } from "./PongMenu"
  



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
        handleWaitingForUser();
        break;
      case 'game_list':
        handleListGames(data, socket);
        break;  
      default:
        console.warn("Unknown message type:", data.type);
        break;
    }
  }

  export function handleGameOver(data: GameOverData) {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
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
      const menu = document.getElementById('menuScreen');
      const gameCanvas = document.getElementById('gameCanvas');
    
      if (gameCanvas) {
        gameCanvas.style.display = 'none'; // Hide the game canvas
      }
    
      if (menu) {
        menu.style.display = 'flex'; // Show menu screen
      }
    }, 5000);
    
  }

  
  export function   handleGameState(data: any) {
    const gameStateData = data as GameStateData;
    const game = gameStateData.game;

    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.display = "block";
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
    // console.log(lp.topPoint.x, " " , lp.topPoint.y, "-", rp.topPoint.x, " " , rp.topPoint.y)
    // Optional: Draw scores or countdown
    // console.log("game.scores ",game.scores);
    ctx.font = "20px Arial";
    ctx.textAlign = "center";

    const scoreEntries = Object.entries(game.scores); // [ [playerName, score], ... ]
    
    const scoreText = scoreEntries
      .map(([name, score]) => `${name}: ${score}`)
      .join("   "); // e.g. "Alice: 3   Bob: 5"
      // ctx.fillText(`${} ${lPlayerScore} : ${rPlayerScore} ${rPlayerName}`, canvas.width / 2,  50);

      ctx.fillText(`${scoreText}`, canvas.width / 2, 30);
    

    // console.log("Canvas size:", canvas.width, canvas.height, canvas.clientWidth, canvas.clientHeight);

  }


  export function handleCountdownGame(data: any) {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    // Hide all UI screens
    document.querySelectorAll(".screen").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    // Show canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }
  
    let countdown = data.value ?? 3;
  
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
      console.error("Canvas element not found");
      return;
    }
   // Hide all UI screens
   document.querySelectorAll(".screen").forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  // ✅ Make canvas visible
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
      ctx.textBaseline = "middle";
  
      ctx.fillText("Waiting for players...", canvas.width / 2, canvas.height / 2);
    };
  
    drawWaiting();
  }

  

  
  export function handleListGames(data: any, socket: WebSocket | null) {
    const aliasInput = document.getElementById('remoteAliasInput') as HTMLInputElement;
    const alias = aliasInput.value.trim();
    localStorage.setItem('pong_alias', alias);  // ✅ store alias

    // console.log("Received game list:", data);
  
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
  
      li.textContent = `Game ID: ${game.id}, Owner: ${game.owner}, Alias: ${game.alias}, State: ${game.state} `;
  
      const joinBtn = document.createElement('button');
      joinBtn.textContent = 'Join';
      joinBtn.disabled = game.state !== 'waiting';
  

      const alias = localStorage.getItem('pong_alias');
      // console.log("Alias:", alias);
      
      

      joinBtn.addEventListener('click', () => {
        const joinRequest = {
          target_endpoint: 'pong-api',
          payload: {
            type: 'join_game',
            pong_data: {
              OpponentAlias: alias,
              gameId: game.id
            }
          }
        };
        
        console.log(joinRequest);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(joinRequest));
            // console.log(`Sent join request for game ${game.id}`);
          } else {
            console.error("Socket is not open");
          }
          
      });
  
      li.appendChild(joinBtn);
      ul.appendChild(li);
    });
  
    container.appendChild(ul);
  }
  