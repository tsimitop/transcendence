import Header from "./components/Header";
import Router from "./models/Router";
import Chat from "./components/Chat";
import { userContext } from "./context/UserContext";

// Boolean flag to prevent multiple chat instances from being created
let chatStartInProgress = false;

/**
 * @brief Initializes the chat component if the user is signed in.
 * Now that tokens are in cookies, we don't need to wait for localStorage.
 */
async function maybeStartChat(): Promise<void> {
  console.log("Try UserContext on maybeStartChat start:", userContext.state);
  if (chatStartInProgress) return;
  chatStartInProgress = true;

  // If user is signed in, start the chat
  if (userContext.state.isSignedIn) {
    console.log("Starting Chat now! Final UserContext:", userContext.state);

    // Prevent duplicate chat instances
    if (!document.querySelector("chat-component")) {
      const chat = Chat.create();

      if (chat && chat instanceof HTMLElement) {
        document.body.appendChild(chat);

		// Initialize the WebSocket connection in the next animation frame
		requestAnimationFrame(async () => {
          await chat.initSocket();
        });
      } else {
        console.warn("Chat.create() returned invalid instance:", chat);
      }
    }

  } else {
    console.error("User not signed in, cannot start chat:", userContext.state);
  }
  chatStartInProgress = false;
}

/**
 * @brief Main application renderer. Initializes routing and components on page load.
 */
const renderApp = async function (): Promise<void> {
  const routeToGo = Router.findRouteToGo();
  const viewToRender = await Router.findViewToRender(routeToGo);

  Router.renderPageBasedOnPath(viewToRender);
  Header.highlightActiveNavLink();
  Router.listenForRouteChange();
  Router.handleBackAndForward();
};

/**
 * @brief Removes the chat component if it exists.
 */
function maybeStopChat(): void {
	const chat = document.querySelector("chat-component");
	if (chat) {
	  chat.remove();
	  Chat.isInitialized = false;
	  console.log("Chat stopped and removed from DOM.");
	}
}

// Execute application setup once the DOM is ready
document.addEventListener("DOMContentLoaded", renderApp);

export { maybeStartChat, maybeStopChat };
