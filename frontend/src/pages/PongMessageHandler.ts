




export function     handlePongMessage(data: any) {
    if (!data.type) {
      console.error("Received message without type");
      return;
    }
  
    switch (data.type) {
    //   case 'create_game':
    //     handleCreateGame(data);
    //     break;
      case 'game_list':
        handleListGames(data);
        break;
  
      // add more cases here for other message types like join_game, play_move, etc.
  
      default:
        console.warn("Unknown message type:", data.type);
        break;
    }
  }
  

  export function handleListGames(data: any) {
    console.log("->", data);

    const container = document.getElementById('availableGamesList');
    if (!container) {
      console.error("No container element found for availableGamesList");
      return;
    }
  
    // Clear existing content
    container.innerHTML = '';

    if (!data.games || data.games.length === 0) {
        container.textContent = 'No available games right now.';
        return;
    }

    // Create a list of games
    const ul = document.createElement('ul');

    data.games.forEach((game: { id: string; owner: string; state: string }) => {
        const li = document.createElement('li');
        li.textContent = `Game ID: ${game.id}, Owner: ${game.owner}, State: ${game.state}`;
        ul.appendChild(li);
    });

    container.appendChild(ul);


  }