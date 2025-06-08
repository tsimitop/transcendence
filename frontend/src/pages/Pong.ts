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
import { userContext } from "../context/UserContext";
import { CADDY_SERVER } from "../constants";


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
  
    // Initialize socket asynchronously after component creation
    setTimeout(async () => {
      await PongInstance.initSocket();
    }, 0);

    // ✅ Wait until DOM is ready before setting up menu
    setTimeout(() => {
      const menu = document.getElementById('menuScreen');
      if (menu) menu.style.display = 'flex';
      else console.warn("menuScreen not found!");

      setupMenu(PongInstance);
    }, 0);

    return PongInstance;
  }

  public async initSocket(): Promise<void> {
    try {
      // Get the access token from the server
      const response = await fetch(`${CADDY_SERVER}/api/ws-token`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.errorMessage || !data.token) {
        console.error("Failed to get WebSocket token:", data.errorMessage);
        this.showSystemMessage("[Pong disabled: No token found]", "text-red-500");
        return;
      }
      
      // Open a WebSocket connection using the token from cookies
      const socketUrl = `${CADDY_SERVER.replace(/^http/, "ws")}/ws?token=${data.token}`;
      this.socket = new WebSocket(socketUrl);
    
      // Connection established
      this.socket.onopen = () => {
        const username = userContext.state.username;

        console.log("Connected to pong server.");
        this.reconnectAttempts = 0;
        this.showSystemMessage("[Connected to server]", "text-green-500");
        this.inputHandler = new PongInputHandler(this.socket!,  username);
        this.inputHandler.start();
      };
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      this.showSystemMessage("[Pong disabled: Connection failed]", "text-red-500");
      return;
    }
  
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if(data.target_endpoint == 'pong-api')
          {
            // Check if the component is still in the DOM before handling messages
            if (document.querySelector('pong-component')) {
              handlePongMessage(data, this.socket);
            }
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
      // Don't try to reconnect if component is no longer in DOM
      if (!document.querySelector('pong-component')) {
        console.log("Pong component not in DOM, stopping reconnection attempts");
        return;
      }
      
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

    /**
     * @brief Cleanup method to properly close WebSocket connection
     */
    public cleanup(): void {
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
        this.socket = null;
      }
      if (this.inputHandler) {
        this.inputHandler.stop();
        this.inputHandler = null;
      }
    }

    /**
     * @brief Called when component is removed from DOM
     */
    public disconnectedCallback(): void {
      this.cleanup();
    }
}
export default Pong;

