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

  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  /********************************************************/
  initializeGame() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas not found in initializeGame!");
      return;
    }
  
    if (!this.socket) {
      console.error("WebSocket not initialized!");
      return;
    }
  
    const game = new PongGame(canvas, this.socket);
    game.start();
  }
  
  /********************************************************/

  initializeWebSocket(onOpenCallback?: () => void) {
    const token = localStorage.getItem('access_token');
    const socketUrl = `wss://localhost:4443/ws?token=${token}`;
    this.socket = new WebSocket(socketUrl);
  
    this.socket.onopen = () => {
      console.log('WebSocket connected');  
      if (onOpenCallback) onOpenCallback(); // ✅ call back to start game
    };
  
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[[[[[[[Received from backend]]]]]]]:', data);
    };
  
    this.socket.onclose = (event) => {
      console.log('WebSocket closed', event);
      this.socket = null;
    };
  
    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }
  
  /********************************************************/
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
  
    PongInstance.initializeWebSocket(() => {
      setupMenu(PongInstance);  // Mount UI handlers after WS connected
    });
  
    return PongInstance;
  }
  
}
export default Pong;


















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