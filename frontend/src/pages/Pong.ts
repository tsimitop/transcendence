import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

import { PongGame } from "./pong/PongMain";

class Pong extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

/********************************************************/
initializeGame() {
  // if (this.gameStarted) return;
  // this.gameStarted = true;

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (canvas) {
    const game = new PongGame(canvas);
    game.start();
  } else {
    console.error("Canvas not found in initializeGame!");
  }
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
    requestAnimationFrame(() => PongInstance.initializeGame()); // ✅
    /**************************************/
    return PongInstance;
  }
}


export default Pong;
