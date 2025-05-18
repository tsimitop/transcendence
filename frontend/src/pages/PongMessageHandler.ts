

export function     handlePongMessage(data: any, socket: WebSocket | null ) {
    console.log("data.type", data.type)
    if (!data.type) {
      console.error("Received message without type");
      return;
    }
    switch (data.type) {
      case 'join_game':
        handleJoinGame(data, socket);
        break;
      case 'game_created':
        handleWaitingForUser(data, socket);
        break;
      case 'create_game':
        handleCreateGame(data, socket);
        break;
      case 'game_list':
        handleListGames(data, socket);
        break;
  
      // add more cases here for other message types like join_game, play_move, etc.
  
      default:
        console.warn("Unknown message type:", data.type);
        break;
    }
  }

  export function handleJoinGame(data: any, socket: WebSocket | null) {



  }




  export function handleWaitingForUser(data: any, socket: WebSocket | null) {
    console.log("handleWaitingForUser");
  
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
  
  // ✅ Make canvas visible
  canvas.style.display = "block";

  // ✅ Ensure it has dimensions
  if (!canvas.width || !canvas.height) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }
  
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.font = "32px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  
    // Draw "Waiting for players..." in the center
    ctx.fillText("Waiting for players...", canvas.width / 2, canvas.height / 2);
  }
  

  
  export function handleCreateGame(data: any, socket: WebSocket | null)  {
    console.log(data);
    console.log(data.gameId);
  }

  
  export function handleListGames(data: any, socket: WebSocket | null) {
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
  
      joinBtn.addEventListener('click', () => {
        const joinRequest = {
          target_endpoint: 'pong-api',
          payload: {
            type: 'join_game',
            gameId: game.id
          }
        };
  
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
  