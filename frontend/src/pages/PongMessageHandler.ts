

export function     handlePongMessage(data: any, socket: WebSocket | null ) {
    console.log("data.type", data.type)
    if (!data.type) {
      console.error("Received message without type");
      return;
    }
    switch (data.type) {
      case 'game_state':
        handleGameState(data);
        break;
      case 'countdown':
        handleCountdownGame(data);
        break;
      case 'game_created':
        handleWaitingForUser();
        break;
      case 'update_game':
        handleUpdateGame(data);
        break;
      case 'game_list':
        handleListGames(data, socket);
        break;  
      default:
        console.warn("Unknown message type:", data.type);
        break;
    }
  }

  
  export function handleGameState(data: any) {
    console.log("handleGameStateFunction", data);
    console.log("handleGameStateFunction", data.game.id);

    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }
  // Clear previous frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const relX = 0.5;    // 50%
  const relY = 0.3;    // 30%
  const relRadius = 0.03; // 3%
  
  const x = canvas.width * relX;
  const y = canvas.height * relY;
  const radius = canvas.width * relRadius; // Based on width to keep it round
  
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

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
          // Continue to main game render logic here
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

  // // ✅ Ensure it has dimensions
  // if (!canvas.width || !canvas.height) {
  //   canvas.width = canvas.clientWidth;
  //   canvas.height = canvas.clientHeight;
  // }
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
  

  
  export function handleUpdateGame(data: any)  {
    console.log(data);
    console.log(data.gameId);
  }

  
  export function handleListGames(data: any, socket: WebSocket | null) {
    const aliasInput = document.getElementById('remoteAliasInput') as HTMLInputElement;
    const alias = aliasInput.value.trim();
    localStorage.setItem('pong_alias', alias);  // ✅ store alias

    console.log("Received game list:", data);
  
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
  
    data.games.forEach((game: { id: string; owner: string; state: string }) => {
      const li = document.createElement('li');
  
      li.textContent = `Game ID: ${game.id}, Owner: ${game.owner}, State: ${game.state} `;
  
      const joinBtn = document.createElement('button');
      joinBtn.textContent = 'Join';
      joinBtn.disabled = game.state !== 'waiting';
  

      const alias = localStorage.getItem('pong_alias');
      console.log("Alias:", alias);
      
      

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
            console.log(`Sent join request for game ${game.id}`);
          } else {
            console.error("Socket is not open");
          }
          
      });
  
      li.appendChild(joinBtn);
      ul.appendChild(li);
    });
  
    container.appendChild(ul);
  }
  

  // function showScreen(screenId: string) {
  //   document.querySelectorAll(".screen").forEach(el => {
  //     (el as HTMLElement).style.display = "none";
  //   });
  //   const screen = document.getElementById(screenId);
  //   if (screen) screen.style.display = "flex";
  // }
  