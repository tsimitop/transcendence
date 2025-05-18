import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

import { PongGame } from "./pong/PongMain2";

import { getPongHTML } from './PON/PongTemplate';
import { setupMenu } from './PON/PongMenu';


export class Pong extends Component {
  public socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;

  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create() {
    history.replaceState({ screen: 'menu' }, '', '');
  
    // Correct method is customElements.get(tagName) — getName doesn't exist
    if (!customElements.get("pong-component")) {
      customElements.define("pong-component", Pong);
    }
  
    // Generate HTML string based on theme state
    const html = getPongHTML(themeState.state);
  
    // Create instance of Pong, passing children for layout
    const PongInstance = new Pong(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
  
    PongInstance.insertChildren();
    PongInstance.classList.add("page");
  
  // Now connect socket and start the game logic
  PongInstance.initSocket(); // socket connects here
  // ✅ Wait until DOM is ready before setting up menu
  setTimeout(() => {
    const menu = document.getElementById('menuScreen');
    if (menu) menu.style.display = 'flex'; // show the menu
    else console.warn("menuScreen not found!");

    setupMenu(PongInstance);
  }, 0);

  return PongInstance;
  }

  /********************************************************/
  // initializeGame() {
  //   const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  //   if (!canvas) {
  //     console.error("Canvas not found in initializeGame!");
  //     return;
  //   }
  
  //   if (!this.socket) {
  //     console.error("WebSocket not initialized!");
  //     return;
  //   }
  
  //   const game = new PongGame(canvas, this.socket);
  //   game.start();
  // }
  
  /********************************************************/

  // public initializeWebSocket(onOpenCallback?: () => void) {
  public initSocket(retryCount = 0) :void {
    const token = localStorage.getItem('access_token');

	  // Retry a few times if token is not yet in localStorage
	  if (!token) {
      if (retryCount >= this.maxReconnectAttempts) {
        console.error("Access token not found. Chat is disabled.");
        // this.showSystemMessage("[Chat disabled: No token found]", "text-red-500");
        return;
      }
    
      console.warn(`Access token missing. Retrying in 500ms... (attempt ${retryCount + 1})`);
      setTimeout(() => this.initSocket(retryCount + 1), 500);
      return;
      }


    const socketUrl = `wss://localhost:4443/ws?token=${token}`;
    this.socket = new WebSocket(socketUrl);
  
	  // Connection established
	  this.socket.onopen = () => {
      console.log("Connected to pong server.");
      this.reconnectAttempts = 0;
      // this.showSystemMessage("[Connected to server]", "text-green-500");
      };
  
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[[[[[[[Received from backend]]]]]]]:', data);
      } catch (err) {
        console.error("Failed to parse message:", event.data, err);
      }
    };

	  // Server closed connection
	  this.socket.onclose = (event) => {
      console.warn(`WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
      // this.tryReconnect();
      };
  
    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }
  
  /********************************************************/

}
export default Pong;



  // 	/**
	//  * @brief Attempts to reconnect using exponential backoff.
	//  */
	// private tryReconnect(): void {
	//   if (this.reconnectAttempts >= this.maxReconnectAttempts) {
	// 	console.error("Max reconnect attempts reached. Chat is permanently offline.");
	// 	this.showSystemMessage("[Disconnected from server]", "text-red-500");
	// 	return;
	//   }
  
	//   const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000); // 1s, 2s, 4s... max 16s
	//   console.warn(`Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts + 1})`);
	//   this.reconnectAttempts++;
  
	//   // Close socket if not already closed
	//   if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
	// 	this.socket.close();
	// 	this.socket = null;
	//   }
  
	//   setTimeout(() => this.initSocket(), delay);
	// }
  // 	/**
	//  * @brief Displays a system message in the chat window.
	//  * Used for events like connection status.
	//  */
	// private showSystemMessage(text: string, cssClass: string): void {
	//   const msgBox = this.querySelector("#pong-messages");
	//   if (msgBox) {
	// 	const message = document.createElement("div");
	// 	message.textContent = text;
	// 	message.classList.add(cssClass, "text-center");
	// 	msgBox.appendChild(message);
	// 	msgBox.scrollTop = msgBox.scrollHeight;
	//   }
	// }
















// static create() {
  //   history.replaceState({ screen: 'menu' }, '', '');

  //   if (!customElements.getName(Pong)) {
  //     customElements.define("pong-component", Pong);
  //   }
  
  //   const html = `
  //     <main class="main-container layout-padding theme-primary-${themeState.state}-full">
  //       <style>
  //         canvas {
  //           border: 1px solid black;
  //           background: rgb(0, 0, 0);
  //           display: none;
  //         }
  //         .screen {
  //           display: none;
  //           flex-direction: column;
  //           align-items: center;
  //           justify-content: center;
  //           gap: 1rem;
  //           margin-top: 3rem;
  //         }
  //         .screen input {
  //           padding: 0.5rem;
  //           font-size: 1rem;
  //         }
  //         .screen button {
  //           font-size: 1.1rem;
  //           padding: 0.6rem 1.5rem;
  //         }
  //       </style>
  
  //       <!-- Mode selection -->
  //       <div id="menuScreen" class="screen">
  //         <h2>Select Game Mode</h2>
  //         <button id="localPlayBtn">Local Play</button>
  //         <button id="remotePlayBtn">Remote Play</button>
  //       </div>
  
  //       <!-- Alias input -->
  //       <div id="aliasScreen" class="screen">
  //         <h2>Enter Player Name(s)</h2>
  //         <input id="player1Input" placeholder="Player 1 alias" />
  //         <input id="player2Input" placeholder="Player 2 alias" style="display: none;" />
  //         <button id="startGameBtn">Start Game</button>
  //       </div>
  
  //       <!-- Game canvas -->
  //       <canvas id="gameCanvas" width="800" height="600"></canvas>
  //     </main>
  //   `;
  
  //   const PongInstance = new Pong(
  //     { html, position: "beforeend" },
  //     { element: Header.create(), position: "afterbegin" },
  //     { element: Footer.create(), position: "beforeend" }
  //   );
  //   PongInstance.insertChildren();
  //   PongInstance.classList.add("page");
  
  //   PongInstance.initializeWebSocket(() => {
  //     const menu = document.getElementById('menuScreen')!;
  //     const alias = document.getElementById('aliasScreen')!;
  //     const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  
  //     const localBtn = document.getElementById('localPlayBtn')!;
  //     const remoteBtn = document.getElementById('remotePlayBtn')!;
  //     const player1Input = document.getElementById('player1Input') as HTMLInputElement;
  //     const player2Input = document.getElementById('player2Input') as HTMLInputElement;
  //     const startBtn = document.getElementById('startGameBtn')!;
  
  //     let selectedMode: 'local' | 'remote' = 'local';
  
  //     // Step 1: show menu
  //     menu.style.display = 'flex';
  
  //     const showAliasScreen = (mode: 'local' | 'remote') => {
  //       selectedMode = mode;
  //       menu.style.display = 'none';
  //       alias.style.display = 'flex';
  
  //       // Show/hide player 2 input depending on mode
  //       player2Input.style.display = mode === 'local' ? 'block' : 'none';
      
  //       // Push state to history
  //     history.pushState({ screen: 'alias', mode }, '', '');
  //     };
  
  //     localBtn.onclick = () => showAliasScreen('local');
  //     remoteBtn.onclick = () => showAliasScreen('remote');
  
  //     startBtn.onclick = () => {
  //       const alias1 = player1Input.value.trim();
  //       const alias2 = player2Input.value.trim();
  
  //       if (!alias1 || (selectedMode === 'local' && !alias2)) {
  //         alert("Please enter all required alias names.");
  //         return;
  //       }
  
  //       // Send selected mode and aliases to backend
  //       PongInstance.socket?.send(JSON.stringify({
  //         type: 'start_game',
  //         mode: selectedMode,
  //         players: selectedMode === 'local'
  //           ? [alias1, alias2]
  //           : [alias1]
  //       }));
  
  //       alias.style.display = 'none';
  //       canvas.style.display = 'block';

  //       // Push state for game
  //       history.pushState({ screen: 'game' }, '', '');
  //       // add to local storage for stats,etc.... 
  //       localStorage.setItem('pong_alias1', alias1);
  //       if (selectedMode === 'local') {
  //         localStorage.setItem('pong_alias2', alias2);
  //       }
  //       // player1Input.value = localStorage.getItem('pong_alias1') || '';
  //       // player2Input.value = localStorage.getItem('pong_alias2') || '';
        
  //       PongInstance.initializeGame();
  //     };
  //   });
  //   window.onpopstate = (event) => {
  //     const state = event.state;
    
  //     const menu = document.getElementById("pong-menu")!;
  //     const alias = document.getElementById("pong-alias")!;
  //     const canvas = document.getElementById("gameCanvas")!;
    
  //     menu.style.display = "none";
  //     alias.style.display = "none";
  //     canvas.style.display = "none";
    
  //     if (!state || state.screen === "menu") {
  //       menu.style.display = "flex";
  //     } else if (state.screen === "alias") {
  //       alias.style.display = "flex";
  //     } else if (state.screen === "game") {
  //       canvas.style.display = "block";
  //     }
  //   };
  //   return PongInstance;
  // }