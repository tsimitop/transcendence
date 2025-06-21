import { userContext } from "../context/UserContext";
import Component, {
	ChildElementType,
	ChildrenStringType,
  } from "../models/Component";
import { CADDY_SERVER } from "../constants";
import DOMPurify from 'dompurify';
import { urlContext } from "../context/UrlContext";
import Router from "../models/Router";
import themeState from "../context/ThemeContext";

  /**
   * Chat component class.
   * @brief Handles UI rendering and WebSocket communication for live chat.
   */
  export class Chat extends Component {
	private socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private blockedUsers = new Set<string>();
	static isInitialized = false;

	constructor(
	  childrenString: ChildrenStringType,
	  ...childElements: ChildElementType[]
	) {
	  super(childrenString, ...childElements);
	}

  	/**
	 * @brief Lifecycle method triggered when the element is added to the DOM.
	 * Sets up event listeners for sending messages.
	 */
	connectedCallback(): void {
		this.fetchBlocked().then(blockedList => {
			this.blockedUsers = new Set(blockedList);
		});
		const sendBtn = this.querySelector("#send-btn") as HTMLButtonElement;
		const input = this.querySelector("#chat-input") as HTMLInputElement;
		const toggleBtn = this.querySelector("#chat-toggle") as HTMLButtonElement;
		const chatContent = this.querySelector("#chat-content") as HTMLDivElement;
	    const recipientSelect = this.querySelector("#recipient-select") as HTMLSelectElement;
		const inviteBtn = this.querySelector("#invite-btn") as HTMLButtonElement;
		if (recipientSelect) {
		this.fetchFriends().then(friends => {
		if (!Array.isArray(friends)) return;

		const uniqueFriends = Array.from(new Set(friends));

		uniqueFriends.forEach(friend => {
			// Exclude blocked users from recipient list
			if (this.blockedUsers.has(friend)) return;

			// Skip if this friend already exists in dropdown (defensive)
			if ([...recipientSelect.options].some(opt => opt.value === friend)) return;

			const option = document.createElement("option");
			option.value = friend;
			option.textContent = friend;
			recipientSelect.appendChild(option);
		  });
		});
		}

		  // Invite & game button logic
		if (recipientSelect && inviteBtn) {
			// Show invite & game button only if a friend is selected 
			recipientSelect.addEventListener("change", () => {
			const value = recipientSelect.value;
			inviteBtn.classList.toggle("hidden", value === "");
			});

			inviteBtn.addEventListener("click", () => {
			const target = recipientSelect.value;
			const from = userContext.state.username;

			if (!target || !from || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;

			const invitePayload = {
				target_endpoint: "chat-api",
				payload: {
				type: "INVITE",
				from,
				to: target,
				},
			};

			this.socket.send(JSON.stringify(invitePayload));
			this.showSystemMessage(`[Invite sent to ${target}]`, "text-blue-600");
			});
		}

		// Handle sending messages
		if (sendBtn && input) {
		  sendBtn.addEventListener("click", () => this.sendMessage(input));
		  input.addEventListener("keypress", (e: KeyboardEvent) => {
			if (e.key === "Enter") sendBtn.click();
		  });
		}

		// Toggle chat visibility
		if (toggleBtn && chatContent) {
		toggleBtn.addEventListener("click", () => {
			const isHidden = chatContent.classList.toggle("hidden");
			toggleBtn.textContent = isHidden ? "Expand" : "Minimize";
		});
		}

		// Intercept username clicks to go to user profile
		this.addEventListener("click", (e: Event) => {
			const target = e.target as HTMLElement;
			if (target?.classList.contains("user-link")) {
				e.preventDefault();
				const username = target.getAttribute("data-username");
				if (username) {
					const newPath = `/users?query=${encodeURIComponent(username)}`;
					urlContext.setState({ path: "/users" }); // This is okay
					Router.redirect(newPath as any);
				}
			}
		});
	}

	/**
	 * @brief Fetches the list of users blocked by the current user.
	 * @returns An array of usernames that the current user has blocked.
	 * @note Used to filter out unwanted messages and prevent interaction
	 *       with blocked users in the chat interface.
	 */
	private async fetchBlocked(): Promise<string[]> {
		try {
			const response = await fetch(`${CADDY_SERVER}/api/friends/blocked`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				userState: userContext.state
			})
			});

			const data = await response.json();
			return data.blockedUsernames || [];
		} catch (error) {
			console.error("Error fetching blocked users:", error);
			return [];
		}
	  }


	/**
	 * @brief Factory method to create and attach a Chat component to the DOM.
	 * @return The Chat instance.
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
		<div id="chat-wrapper" class="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
			<div class="bg-white rounded shadow p-2 flex flex-col space-y-2">
			<div class="flex justify-between items-center">
				<span class="font-bold">Chat</span>
				<button id="chat-toggle" class="text-xs text-blue-500 underline">Expand</button>
			</div>
			<div id="chat-content" class="hidden">
				<div class="flex space-x-1 items-center mb-1">
				<select id="recipient-select" class="flex-1 p-1 border rounded">
					<option value="">🌐 Global Chat</option>
				</select>
				<button id="invite-btn" class="p-1 px-2 bg-green-500 text-white rounded text-xs hidden">
					Invite
				</button>
				</div>
				<div id="chat-messages" class="flex-1 overflow-y-auto h-64 border p-2 rounded bg-gray-100 text-sm space-y-1"></div>
				<div class="flex mt-2">
				<input type="text" id="chat-input" class="flex-1 p-2 border rounded" placeholder="Type a message..." />
				<button id="send-btn" class="p-2 theme-btn-${themeState.state} text-white rounded ml-1">Send</button>
				</div>
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
	 * @brief Sends the current input value to the WebSocket server.
	 *
	 * @param input - The HTML input element containing the user's message.
	 */
	private sendMessage(input: HTMLInputElement): void {
		const trimmedMessage = input.value.trim();
		const username = userContext.state.username;
		const recipientSelect = this.querySelector("#recipient-select") as HTMLSelectElement;
		const selectedRecipient = recipientSelect?.value || "";

		if (trimmedMessage && this.socket?.readyState === WebSocket.OPEN && username) {
			// console.log("Sending message as:", username); // debug Chat print 
			const messagePayload: any = {
			target_endpoint: "chat-api",
			payload: {
				type: "CHAT",
				from: username,
				message: trimmedMessage,
			}
		  };

		  if (selectedRecipient) {
		  messagePayload.payload.to = selectedRecipient;
		  }
		  this.socket.send(JSON.stringify(messagePayload));
		  input.value = ""; // Clear input field
		}
	  }

	/**
	 * @brief Loads Friendslist of the current user from the server.
	 * @returns Lists Usernames of friends as an array.
	 */
	private async fetchFriends(): Promise<string[]> {
	  try {
		const response = await fetch(`${CADDY_SERVER}/api/friends/list`, {
		  method: "POST",
		  credentials: "include",
		  headers: {
			"Content-Type": "application/json"
		},
		  body: JSON.stringify({
			userState: userContext.state
		})
	  });

		if (!response.ok) throw new Error("Server responded with error");

		const data = await response.json();
		return data.friends || [];
	  } catch (error) {
		console.error("Error fetching friends:", error);
		return [];
	  }
	}
  
	public async initSocket(): Promise<void> {
	  try {
		// Get the access token from the server
		const response = await fetch(`${CADDY_SERVER}/api/ws-token`, {
		  method: "GET",
		  credentials: "include",
		});
		const data = await response.json();
		console.log("data after fetching ws-token:", data);
		if (data.errorMessage || !data.token) {
		  console.error("Failed to get WebSocket token:", data.errorMessage);
		  this.showSystemMessage("[Chat disabled: No token found]", "text-red-500");
		  return;
		}

		// Open a WebSocket connection using the token from cookies
		const socketUrl = `${CADDY_SERVER.replace(/^http/, "ws")}/ws?token=${data.token}&type=chat`;
		console.log("Connecting to chat server at:", socketUrl);
		this.socket = new WebSocket(socketUrl);

		// Connection established
		this.socket.onopen = () => {
		  console.log("Connected to chat server.");
		  this.reconnectAttempts = 0;
		  this.showSystemMessage("[Connected to server]", "text-green-500");
		};
	  } catch (error) {
		console.error("Failed to initialize WebSocket:", error);
		this.showSystemMessage("[Chat disabled: Connection failed]", "text-red-500");
		return;
	  }
  
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
	  
		// skip messages from blocked users
		if (parsed.from && this.blockedUsers.has(parsed.from)) return;

		// Sanitize all user-controlled input
		const safeFrom = DOMPurify.sanitize(parsed.from || "");
		// const safeTo = DOMPurify.sanitize(parsed.to || "");
		const safeMessage = DOMPurify.sanitize(parsed.message || "");
		const message = document.createElement("div");
	  
		switch (parsed.type) {
		  case "SYSTEM":
			message.textContent = `[${safeMessage}]`;
			message.classList.add("text-gray-500", "italic");
			if (
				safeMessage === "Friendship accepted" ||
				safeMessage === "User blocked" ||
				safeMessage === "User unblocked") {
				console.log(`[WS] SYSTEM: ${safeMessage} – refreshing UI`);
				this.refreshFriendsDropdown();
				this.showSystemMessage(`[${safeMessage}]`, "text-blue-500");
				import("../context/UserContext").then(({ refreshRelations }) => {
				refreshRelations().then(() => {
					console.log(`[WS] UserContext refreshed after SYSTEM: ${safeMessage}`);
				});
				});
			}
			break;

		case "CHAT":
			// Determine if the message is a direct message (DM)
			const currentUser = userContext.state.username;
			if (parsed.to) {
				const isInbound = parsed.to === currentUser;
				const isOutbound = parsed.from === currentUser;
				
				// Only show DMs if you're the sender or recipient
				if (!(isInbound || isOutbound)) return;
				console.log("[Chat] Rendering DM message:", safeFrom, "->", parsed.to);
				// Render "[DM] from <username>: <message>"

				const label = document.createElement("span");
				label.textContent = "[DM]";
				label.className = "font-semibold text-gray-600";

				const anchor = document.createElement("a");
				anchor.href = "#";
				anchor.textContent = safeFrom;
				anchor.className = "text-blue-600 hover:underline font-medium user-link";
				anchor.dataset.username = safeFrom;
				// Enable profile link via Router on username click
				anchor.addEventListener("click", (e) => {
					e.preventDefault();
					Router.navigateWithQuery("/users", `query=${encodeURIComponent(safeFrom)}`);
				});

				message.appendChild(label);
				message.appendChild(document.createTextNode(" "));
				message.appendChild(anchor);
				message.appendChild(document.createTextNode(`: ${safeMessage}`));
			} else {
				// Global/public message rendering: <username>: <message>
				const anchor = document.createElement("a");
				anchor.href = "#";
				anchor.textContent = safeFrom;
				anchor.className = "text-blue-600 hover:underline user-link";
				anchor.dataset.username = safeFrom;
				// Profile navigation
				anchor.addEventListener("click", (e) => {
					e.preventDefault();
					Router.navigateWithQuery("/users", `query=${encodeURIComponent(safeFrom)}`);
				});

				const bold = document.createElement("b");
				bold.appendChild(anchor);

				message.appendChild(bold);
				message.appendChild(document.createTextNode(`: ${safeMessage}`));
			}

			message.classList.add("text-black");
			break;

		  case "INVITE":
			// Render game invite with accept button
			const inviteFrom = safeFrom;
			message.classList.add("text-yellow-600");

			const textNode = document.createTextNode(`[Quickmatch invite from ${inviteFrom}] `);
			message.appendChild(textNode);

			const acceptBtn = document.createElement("button");
			acceptBtn.textContent = "Accept";
			acceptBtn.className = "ml-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded";
			// Send invite acceptance back to the server via WebSocket
			acceptBtn.addEventListener("click", () => {
				const acceptPayload = {
					target_endpoint: "chat-api",
					payload: {
						type: "INVITE",
						from: userContext.state.username,
						to: inviteFrom,
						message: "ACCEPT"
					}
				};
				this.socket?.send(JSON.stringify(acceptPayload));
				this.showSystemMessage(`You accepted ${inviteFrom}'s invite`, "text-green-600");
			});

			message.appendChild(acceptBtn);
			break;

		  case "TOURNAMENT_NOTIFICATION":
			// Display tournament-related system messages
			message.textContent = `[Tournament] ${safeMessage}`;
			message.classList.add("text-purple-600", "font-semibold");
			break;

		  case "FRIENDSHIP_UPDATE":
			console.log("[WS] FRIENDSHIP_UPDATE received – updating UI");
			this.refreshFriendsDropdown();
			// this.showSystemMessage("[Friendship updated]", "text-blue-500");
			import("../context/UserContext").then(({ refreshRelations }) => {
				refreshRelations().then(() => {
				console.log("[WS] UserContext refreshed after FRIENDSHIP_UPDATE");
				});
			});

  break;


		  default:
			// Fallback handler for unknown message types
			message.textContent = `[Unknown message type]: ${DOMPurify.sanitize(parsed.type)}`;
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

	private lastDropdownUpdate = 0;

	/**
	 * @brief Refreshes the friends dropdown after updates (e.g. friend accepted).
	 */
	public async refreshFriendsDropdown(): Promise<void> {
		const now = Date.now();

		// Verhindert mehrfachen Aufruf innerhalb von 2 Sekunden
		if (now - this.lastDropdownUpdate < 2000) {
			console.log("[Dropdown] Skipping redundant refresh.");
			return;
		}
		this.lastDropdownUpdate = now;

		const recipientSelect = this.querySelector("#recipient-select") as HTMLSelectElement;
		if (!recipientSelect) return;

		recipientSelect.innerHTML = `<option value="">🌐 Global Chat</option>`;
		const friends = await this.fetchFriends();
		console.log("[Dropdown] Friends fetched from server:", friends);

		friends.forEach(friend => {
			const option = document.createElement("option");
			option.value = friend;
			option.textContent = friend;
			recipientSelect.appendChild(option);
		});
	}

	/**
	 * @brief Returns the active WebSocket instance (read-only).
	 */
	public getSocket(): WebSocket | null {
	  return this.socket;
	}
}
  
  export default Chat;
  