import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

import { getPongHTML } from './pong/PongTemplate';
import { setupMenu } from './pong/PongMenu';
import { handlePongMessage } from "./pong/PongMessageHandler";
import { PongInputHandler } from "./pong/PongInputHandler";


export class Pong extends Component {
/*****************************************************/
/**************     Variables    *********************/
/*****************************************************/
  public socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
  private inputHandler: PongInputHandler | null = null;

  /*****************************************************/
/**************     Constructor  *********************/
/*****************************************************/
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

/*****************************************************/
/**************        Methods   *********************/
/*****************************************************/
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

  public initSocket(retryCount = 0): void {
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
      this.showSystemMessage("[Connected to server]", "text-green-500");
      this.inputHandler = new PongInputHandler(this.socket!, "emptY" );
      this.inputHandler.start();



      };
  
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if(data.target_endpoint == 'pong-api')
          {
            // console.log("Parsed message:", data);
            handlePongMessage(data, this.socket);
          }
        } catch (e) {
          console.error("Failed to parse JSON from backend:", e);
        }
      };
      

	  // Server closed connection
	  this.socket.onclose = (event) => {
      console.warn(`WebSocket closed (code: ${event.code}, reason: ${event.reason}), event: ${event}`);
      this.tryReconnect();
      if (this.inputHandler) {
        this.inputHandler.stop();
        this.inputHandler = null;
      }
      };
  
    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }
  
  /********************************************************/

  
  
      /**
     * @brief Attempts to reconnect using exponential backoff.
     */
    private tryReconnect(): void {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached. Chat is permanently offline.");
      this.showSystemMessage("[Disconnected from server]", "text-red-500");
      return;
      }
    
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000); // 1s, 2s, 4s... max 16s
      console.warn(`Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts + 1})`);
      this.reconnectAttempts++;
    
      // Close socket if not already closed
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
      this.socket = null;
      }
    
      setTimeout(() => this.initSocket(), delay);
    }
      /**
     * @brief Displays a system message in the chat window.
     * Used for events like connection status.
     */
    private showSystemMessage(text: string, cssClass: string): void {
      const msgBox = this.querySelector("#pong-messages");
      if (msgBox) {
      const message = document.createElement("div");
      message.textContent = text;
      message.classList.add(cssClass, "text-center");
      msgBox.appendChild(message);
      msgBox.scrollTop = msgBox.scrollHeight;
      }
    }
}
export default Pong;

