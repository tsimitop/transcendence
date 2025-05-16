import Component, {
	ChildElementType,
	ChildrenStringType,
  } from "../models/Component";
  
  /**
   * Chat component class.
   * @brief Handles UI rendering and WebSocket communication for live chat.
   */
  export class Chat extends Component {
	private socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
  
	constructor(
	  childrenString: ChildrenStringType,
	  ...childElements: ChildElementType[]
	) {
	  super(childrenString, ...childElements);
	}
  
	static isInitialized = false;
	/**
	 * @brief Factory method to create and attach a Chat component to the DOM.
	 * @return the Chat instance.
	 * @note During development with Vite (HMR), this component might be hot-reloaded.
	 * As a result, the WebSocket connection will automatically reconnect,
	 * causing multiple "[Connected to server]" and "Welcome" messages in the chat.
	 *
	 * This is expected behavior and does NOT happen in production builds.
	 * See also logs in backend: [WS] User connected/disconnected.
	 */
	static create(): Chat {
	  // Check if the component is already initialized
	  if (Chat.isInitialized) return null as any;
	  Chat.isInitialized = true;
	  // Check if the component is already defined
	  if (!customElements.getName(Chat)) {
		customElements.define("chat-component", Chat);
	  }
  
	  // HTML structure of the chat box
	  const html = `
		<div class="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
		  <div class="w-full bg-white rounded shadow p-4 flex flex-col space-y-2">
			<div id="chat-messages" class="flex-1 overflow-y-auto h-64 border p-2 rounded bg-gray-100 text-sm space-y-1"></div>
			<div class="flex">
			  <input type="text" id="chat-input" class="flex-1 p-2 border rounded-l" placeholder="Type a message..." />
			  <button id="send-btn" class="p-2 bg-blue-500 text-white rounded-r">Send</button>
			</div>
		  </div>
		</div>
	  `;
  
	  // Create and insert the chat component
	  const chatInstance = new Chat({ html, position: "beforeend" });
	  chatInstance.insertChildren();
	  return chatInstance;
	}
  
	/**
	 * @brief Lifecycle method triggered when the element is added to the DOM.
	 * Sets up event listeners for sending messages.
	 */
	connectedCallback(): void {
	  const sendBtn = this.querySelector("#send-btn") as HTMLButtonElement;
	  const input = this.querySelector("#chat-input") as HTMLInputElement;
  
	  if (sendBtn && input) {
		// Send message when button clicked
		sendBtn.addEventListener("click", () => this.sendMessage(input));
  
		// Send message on Enter key
		input.addEventListener("keypress", (e: KeyboardEvent) => {
		  if (e.key === "Enter") sendBtn.click();
		});
	  }
	}
  
	/**
	 * @brief Sends the current input value to the WebSocket server.
	 */
	private sendMessage(input: HTMLInputElement): void {
	  const trimmedMessage = input.value.trim();
	  if (trimmedMessage && this.socket?.readyState === WebSocket.OPEN) {
		this.socket.send(
		  JSON.stringify(
		{
			target_endpoint: "chat-api",  // specify the target endpoint so we can use the ws for pong too
			payload: {
				type: "CHAT",
				message: trimmedMessage,
		  }
		}
		)
		);
		input.value = ""; // Clear input field
	  }
	}
  
	/**
	 * @brief Initializes a WebSocket connection with retry logic if the token is missing.
	 */
	public initSocket(retryCount = 0): void {
	  const token = localStorage.getItem("access_token");
  
	  // Retry a few times if token is not yet in localStorage
	  if (!token) {
		if (retryCount >= this.maxReconnectAttempts) {
		  console.error("Access token not found. Chat is disabled.");
		  this.showSystemMessage("[Chat disabled: No token found]", "text-red-500");
		  return;
		}
  
		console.warn(`Access token missing. Retrying in 500ms... (attempt ${retryCount + 1})`);
		setTimeout(() => this.initSocket(retryCount + 1), 500);
		return;
	  }
  
	  // Open a WebSocket connection using the JWT token
	  const socketUrl = `wss://localhost:4443/ws?token=${token}`;
	  this.socket = new WebSocket(socketUrl);
  
	  // Connection established
	  this.socket.onopen = () => {
		console.log("Connected to chat server.");
		this.reconnectAttempts = 0;
		this.showSystemMessage("[Connected to server]", "text-green-500");
	  };
  
	  // Incoming message from server
	  this.socket.onmessage = (event) => {
		const msgBox = this.querySelector("#chat-messages");
		if (!msgBox) return;
	  
		let parsed;
		try {
		  parsed = JSON.parse(event.data);
		} catch (err) {
		  console.warn("Invalid message format:", event.data);
		  return;
		}
	  
		const message = document.createElement("div");
	  
		switch (parsed.type) {
		  case "SYSTEM":
			message.textContent = `[${parsed.message}]`;
			message.classList.add("text-gray-500", "italic");
			break;
	  
		  case "CHAT":
			message.textContent = `${parsed.from}: ${parsed.message}`;
			message.classList.add("text-black");
			break;
	  
		  case "INVITE":
			message.textContent = `[Invite from ${parsed.from}]`;
			message.classList.add("text-blue-500");
			break;
	  
		  default:
			message.textContent = `[Unknown message type]`;
			message.classList.add("text-red-500");
		}
	  
		msgBox.appendChild(message);
		msgBox.scrollTop = msgBox.scrollHeight;
	  };
	  
  
	  // WebSocket error
	  this.socket.onerror = (e) => {
		console.error("WebSocket error:", e);
	  };
  
	  // Server closed connection
	  this.socket.onclose = (event) => {
		console.warn(`WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
		this.tryReconnect();
	  };
	}
  
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
	  const msgBox = this.querySelector("#chat-messages");
	  if (msgBox) {
		const message = document.createElement("div");
		message.textContent = text;
		message.classList.add(cssClass, "text-center");
		msgBox.appendChild(message);
		msgBox.scrollTop = msgBox.scrollHeight;
	  }
	}
  }
  
  export default Chat;
  