import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

import { PongGame } from "./pong/PongMain";

class Pong extends Component {
  private socket: WebSocket | null = null;

  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  /********************************************************/
  initializeGame() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      const game = new PongGame(canvas);
      game.start();
      this.initializeWebSocket();  // Start WS connection here
    } else {
      console.error("Canvas not found in initializeGame!");
    }
  }
  /********************************************************/

  initializeWebSocket() {
    const token = localStorage.getItem('access_token'); // Replace with your actual JWT token

	  const socketUrl = `wss://localhost:4443/ws?token=${token}`;
	  this.socket = new WebSocket(socketUrl);


    this.socket.onopen = () => {
      console.log('WebSocket connectedsetdsfadsfafadsfadsffddgsdsDF');

      // Example: send input message to backend on connection
      this.socket?.send(JSON.stringify({
        target_endpoint: 'pong-api',
        payload: {
          type: 'input',
          pong_data: {
            up: true,
            down: false,
          }
        }
      }));
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received from backend:', data);

      // Here you could handle messages from the backend, e.g. update game state
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
    if (!customElements.getName(Pong)) {
      customElements.define("pong-component", Pong);
    }

    const html = `
      <main class="main-container layout-padding theme-primary-${themeState.state}-full">
        <style>
          canvas {
            border: 1px solid black;
            background: rgb(0, 0, 0);
          }
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
        </style>
        <canvas id="gameCanvas" width="800" height="600"></canvas>
      </main>
    `;

    const PongInstance = new Pong(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    PongInstance.insertChildren();
    PongInstance.classList.add("page");

    /**************************************/
    requestAnimationFrame(() => PongInstance.initializeGame());
    /**************************************/

    return PongInstance;
  }
}

export default Pong;
