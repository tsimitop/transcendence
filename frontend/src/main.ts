import Header from "./components/Header";
import Router from "./models/Router";
import Chat from "./components/Chat";
import { userContext } from "./context/UserContext";

// Boolean flag to prevent multiple chat instances from being created
let chatStartInProgress = false;

/**
 * @brief Initializes the chat component if the user is signed in and has a valid JWT token.
 * Waits for userContext to be fully populated if necessary.
 */
async function maybeStartChat(): Promise<void> {
  console.log("Try UserContext on maybeStartChat start:", userContext.state);
  if (chatStartInProgress) return;
  chatStartInProgress = true;

  let tries = 0;

  // Wait until userContext is fully populated or max retries reached
  while (
    (!userContext.state.isSignedIn || !userContext.state.jwtAccessToken) &&
    tries < 10
  ) {
    console.log(`Waiting for userContext to be ready... (attempt ${tries + 1})`, userContext.state);
    await new Promise(resolve => setTimeout(resolve, 500));
    tries++;
  }

  // If user is signed in and token is ready, start the chat
  if (userContext.state.isSignedIn && userContext.state.jwtAccessToken) {
    console.log("Starting Chat now! Final UserContext:", userContext.state);

    // Save token for WebSocket authentication
    localStorage.setItem("access_token", userContext.state.jwtAccessToken);

    // Prevent duplicate chat instances
    if (!document.querySelector("chat-component")) {
      const chat = Chat.create();

      if (chat && chat instanceof HTMLElement) {
        document.body.appendChild(chat);

		// Initialize the WebSocket connection in the next animation frame
		requestAnimationFrame(() => {
          chat.initSocket();
        });
      } else {
        console.warn("Chat.create() returned invalid instance:", chat);
      }
    }

  } else {
    console.error("User still not signed in after waiting, final state:", userContext.state);
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
 * @brief Removes the chat component and clears the access token if it exists.
 */
function maybeStopChat(): void {
	const chat = document.querySelector("chat-component");
	if (chat) {
	  chat.remove();
	  Chat.isInitialized = false;
	  console.log("Chat stopped and removed from DOM.");
	}
  
	localStorage.removeItem("access_token");
}

// Execute application setup once the DOM is ready
document.addEventListener("DOMContentLoaded", renderApp);

export { maybeStartChat, maybeStopChat };
