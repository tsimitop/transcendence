




export function     handlePongMessage(data: any, socket: WebSocket | null ) {
    if (!data.type) {
      console.error("Received message without type");
      return;
    }
  
    switch (data.type) {
    //   case 'create_game':
    //     handleCreateGame(data);
    //     break;
      case 'game_list':
        handleListGames(data, socket);
        break;
  
      // add more cases here for other message types like join_game, play_move, etc.
  
      default:
        console.warn("Unknown message type:", data.type);
        break;
    }
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
  