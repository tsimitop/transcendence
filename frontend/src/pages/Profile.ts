import Footer from "../components/Footer";
import Header from "../components/Header";
import { CADDY_SERVER } from "../constants";
import themeState from "../context/ThemeContext";
import { urlContext } from "../context/UrlContext";
import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import Router from "../models/Router";
import { removeElementsWithSimilarClassName } from "../utils/remove-elements-with-similar-class-name";
import DOMPurify from 'dompurify';
import { refreshRelations } from "../context/UserContext";

type Activate2FaResponseType = {
  dataUrl: string;
};

interface FriendRequest {
  id: string;
  username: string;
}

interface FriendStatus {
  online: string;
  username: string;
}
interface BlockedUser {
  username: string;
}

class Profile extends Component {
  static message2FaclassName = "message-2fa";
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("sign-out-btn")) {
      Profile.signOut();
    } else if (target.classList.contains("activate-2fa-btn")) {
      Profile.activate2Fa();
    } else if (target.classList.contains("confirm-qrcode-scan-btn")) {
      Profile.confirmQrCodeScan();
    } else if (target.classList.contains("submit-2fa-activation-btn")) {
      Profile.submit2FaCodeActivation(event);
    } else if (target.classList.contains("deactivate-2fa-btn")) {
      Profile.deactivate2Fa();
    } else if (target.classList.contains("submit-2fa-deactivation-btn")) {
      Profile.submit2FaCodeDeactivation(event);
    } else if (target.classList.contains("accept-btn")) {
      Profile.handlePendingAction(event, 'accept');
    } else if (target.classList.contains("block-btn")) {
      Profile.handlePendingAction(event, 'block');
	}
  }

  public static async signOut() {
    try {
      // console.log("signing out");
	  const user = userContext.state;
      const response = await fetch(`${CADDY_SERVER}/api/sign-out`, {
        method: "POST",
        credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
	    body: JSON.stringify({ user }),
      });
      const data = await response.json();
      if (!data.errorMessage) {
        userContext.setState({
          ...userContext.state,
          id: "",
          email: "",
          username: "",
          isSignedIn: false,
		  avatar: "",
        });
        const routeToGo = "/";
        urlContext.setState({ ...urlContext.state, path: routeToGo });
        window.history.pushState({}, "", routeToGo);
        await Router.redirect(routeToGo);
        // Header.highlightActiveNavLink();
      }
    } catch (error) {
      console.log(error);
    }
  }

  public static async activate2Fa() {
    const user = userContext.state;
    const main = document.querySelector(".main-container") as HTMLElement;

    try {
      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
      const has2Fa = await Router.is2FaActive(user);
      if (has2Fa) {
        const message2FaAlreadyActive = main.querySelector(
          ".already-active-2fa-message"
        );
        if (message2FaAlreadyActive) {
          main.removeChild(message2FaAlreadyActive);
        }
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="already-active-2fa-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, you have already activated 2FA!</p>`
        );
        return;
      }

      const response = await fetch(`${CADDY_SERVER}/api/activate-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      const data = (await response.json()) as Activate2FaResponseType;
      const { dataUrl } = data;

      const qrCode = main.querySelector(".qrcode");
      if (qrCode) {
        return;
      }
      main.insertAdjacentHTML(
        "beforeend",
        `
				<div class="${Profile.message2FaclassName} qrcode flex flex-col items-center gap-4">
					<img src=${dataUrl} width=200px alt=qrcode />
					<div class="activate-2fa-description text-center">
						<p>Please scan the QR Code using a two-factor authentication app,</p>
						<p>and only then click the <span class="italic">confirm 2FA</span> button</p>
					</div>
					<button class="confirm-qrcode-scan-btn theme-btn-${themeState.state} py-2 cursor-pointer w-[120px]">
						Confirm 2FA
					</button>
				</div>
				`
      );
    } catch (error) {
      console.log(error);
    }
  }

  public static async confirmQrCodeScan() {
    const main = document.querySelector(".main-container") as HTMLElement;

    removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
    // const descriptionText = document.querySelector(".activate-2fa-description");
    main.insertAdjacentHTML(
      "beforeend",
      `
				<div class="${Profile.message2FaclassName} flex flex-col items-center gap-4 mb-12">
					<p>Please confirm the 2FA activation by sending your 6-digit code</p>
					<form class="flex gap-4 items-center">
					<label for="confirm-2fa">2FA Code</label>
					<input class="theme-input-${themeState.state} px-2 py-1" type="number" id="confirm-2fa" name="confirm-2fa" />
					<button type="submit" class="theme-btn-${themeState.state} submit-2fa-activation-btn py-1 cursor-pointer w-[80px]">Submit</button>
					</form>
				</div>
			`
    );

    return;
  }

  public static async submit2FaCodeActivation(event: MouseEvent) {
    event.preventDefault();
    const user = userContext.state;
    const main = document.querySelector(".main-container") as HTMLElement;
    const input = document.getElementById("confirm-2fa") as HTMLInputElement;
    const code2Fa = input.value;
    try {
      const validationResponse = await fetch("/api/validate-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, code2Fa }),
        signal: AbortSignal.timeout(5000),
      });

      const validationData = await validationResponse.json();
      if (validationData.errorMessage) {
        throw validationData;
      }

      const response = await fetch(`${CADDY_SERVER}/api/confirm-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      await response.json();

      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);

      main.insertAdjacentHTML(
        "beforeend",
        `<p class="confirmed-2fa-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, 2FA is activated</p>`
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "errorMessage" in error &&
        error.errorMessage
      ) {
        removeElementsWithSimilarClassName("retry-submit-2fa", main);
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} retry-submit-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, ${error.errorMessage}</p>`
        );
      } else {
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, Something went wrong!</p>`
        );
      }
      console.log(error);
    }
  }

  public static create() {
    if (!customElements.getName(Profile)) {
      customElements.define("profile-component", Profile);
    }

    const main = document.createElement("main");
    main.classList.add(
      "main-container",
      "layout-padding",
      `${
        themeState.state === "light"
          ? "theme-primary-light-full"
          : "theme-primary-dark-full"
      }`
    );

    main.addEventListener("click", Profile.handleClick);

	//PLACEHOLDER
	let friendRequestsHtml = `
	  <div class="flex gap-8 ml-auto" id="friend-management-section">
	    <div class="flex flex-col text-left">
	      <label class="mb-1 font-semibold">Friends</label>
	      <ul id="friends-list" class="list-none">
	      </ul>
	    </div>
	    <div class="flex flex-col text-left">
		  <label class="mb-1 font-semibold">Blocked Users</label>
	      <ul id="blocked-list" class="list-none">
	      </ul>
	    </div>
	    <div class="text-right" id="pending-friend-requests">
	    </div>
	  </div>
	`;

	//MAIN HTML
	const safeUsername = DOMPurify.sanitize(userContext.state.username || "");
	const safeEmail = DOMPurify.sanitize(userContext.state.email || "");
	const safeAvatar = DOMPurify.sanitize(userContext.state.avatar || "");
	const html = `
	<div class="flex items-center justify-between mt-12 mb-6">
	  <h1 class="text-5xl font-bold">Profile</h1>
	  <button class="sign-out-btn theme-btn-secondary-${themeState.state} px-4 py-2 cursor-pointer">
	    Sign out
	  </button>
	</div>

	<div class="flex flex-col gap-1 mb-20">
	  <img
	    src=${CADDY_SERVER}/avatars/${safeAvatar}
	    alt="File: ${safeAvatar}"
		class="w-24 h-24 object-cover rounded-full"
		/>
		<p>username: ${safeUsername}</p>
	  <p>email: ${safeEmail}</p>
	</div>

	<div class="flex justify-between items-start mb-12">
	  <div>
	    <h2 class="text-3xl font-bold mb-6">Settings</h2>
	    <div class="flex flex-col gap-2 w-[120px]">
	      <button class="activate-2fa-btn theme-btn-${themeState.state} py-2 cursor-pointer">
	        Activate 2FA
	      </button>
	      <button class="deactivate-2fa-btn theme-btn-${themeState.state} py-2 cursor-pointer">
	        Deactivate 2FA
	      </button>

	    </div>
	  </div>
	  ${friendRequestsHtml}
	</div>
`;

    main.insertAdjacentHTML("beforeend", html);

	Profile.friendList();
	Profile.blockedList();
	Profile.fetchAndRenderFriendRequests();

    const SignOutInstance = new Profile(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignOutInstance.insertChildren();
    SignOutInstance.classList.add("page");

    return SignOutInstance;
  }

static fetchAndRenderFriendRequests() {
  const user = userContext.state;
  fetch(`${CADDY_SERVER}/api/friends/pending`, {
	method: "POST",
	headers: {
		'Content-Type': 'application/json'
	},
    credentials: "include",
	body: JSON.stringify({ userState: user })
  })
    .then(res => res.json())
    .then((data: { success: boolean; pendingUsers: FriendRequest[] }) => {
      const container = document.getElementById('pending-friend-requests');
      if (!container) 
		return;

      if (!data.pendingUsers || data.pendingUsers.length === 0) {
        container.innerHTML = '<p>No pending friend requests</p>';
        return;
      }
	  //DYNAMIC HTML per pending user
      let requestsHtml = `<h2>Pending Friend Requests</h2><ul>`;
	  data.pendingUsers.forEach(request => {
        const safeUsername = DOMPurify.sanitize(request.username || "");
        requestsHtml += `
          <li class="mb-4 flex items-center justify-between">
            <span>${safeUsername}</span>
            <div class="flex gap-2">
              <button
                class="accept-btn theme-btn-${themeState.state} py-2 px-3 rounded cursor-pointer"
                data-userid="${request.id}">
                Accept
              </button>
              <button
                class="block-btn theme-btn-${themeState.state} py-2 px-3 rounded cursor-pointer"
                data-userid="${request.id}">
                Block
              </button>
            </div>
          </li>
        `;
      });
      requestsHtml += `</ul>`;
      container.innerHTML = requestsHtml;
    })
    .catch(console.error);
  }

  static friendList() {
    const userState = userContext.state;
    fetch(`${CADDY_SERVER}/api/friends/list_friend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ id: userState.id })
    })
    .then(res => res.json())
	.then((data: { success: boolean; friends: FriendStatus[] }) => {
      const container = document.getElementById('friends-list') as HTMLSelectElement;
      if (!container) return;
	  // console.log("Friend list response:", data);
      if (!data.friends || data.friends.length === 0) {
        container.innerHTML = '<option disabled>No friends yet</option>';
        return;
      }

	  container.innerHTML = "";
	  //   console.log(`Checking friends: ${data.friends}`);
	  //DYNAMIC HTML per friend (option)
	  data.friends.forEach(friend => {
		const safeUsername = DOMPurify.sanitize(friend.username || "");
		const listElement = document.createElement("li");
		listElement.textContent = `${safeUsername} ${friend.online}`;
		container.appendChild(listElement);
      });
    })
    .catch((err) => {
  	  console.error("Friend list fetch error:", err);
	});
  }


  static blockedList() {
    const userState = userContext.state;
    fetch(`${CADDY_SERVER}/api/friends/list_block`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ id: userState.id })
    })
    .then(res => res.json())
	.then((data: { success: boolean; blocked: BlockedUser[] }) => {
      const container = document.getElementById('blocked-list') as HTMLSelectElement;
      if (!container) return;
	  // console.log("Blocked list response:", data);
      if (!data.blocked || data.blocked.length === 0) {
        container.innerHTML = '<option disabled>No blocked users</option>';
        return;
      }

	  container.innerHTML = "";
	  //   console.log(`Checking blocked: ${data.blocked}`);
	  //DYNAMIC HTML per blocked user (option)
	  data.blocked.forEach(enemy => {
		const safeUsername = DOMPurify.sanitize(enemy.username || "");
		const listElement = document.createElement("li");
		listElement.textContent = `${safeUsername}`;
		container.appendChild(listElement);
      });
    })
    .catch((err) => {
  	  console.error("Blocked list fetch error:", err);
    });
  }

  public static async handlePendingAction(event: MouseEvent, action: 'accept' | 'block') {
    const userState = userContext.state;
    const target = event.target as HTMLElement;
    const userIdBtn = target?.getAttribute("data-userid");
  
    if (!userIdBtn) {
      console.error(`User ID [${userIdBtn}] not found on ${action} button.`);
      return;
    }
  
    try {
      const response = await fetch(`${CADDY_SERVER}/api/friends/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ userState, userIdBtn: parseInt(userIdBtn) })
      });
  
      if (!response.ok) {
        console.error(`Failed to ${action} user ID [${userIdBtn}]`);
        console.error("response", response);
        return;
      }

      await refreshRelations();
      Profile.friendList();
      Profile.blockedList();
	  Profile.fetchAndRenderFriendRequests();
	  // Refresh the friends list
	  const chatComponent = document.querySelector("chat-component");
	  if (chatComponent && typeof (chatComponent as any).refreshFriendsDropdown === "function") {
		(chatComponent as any).refreshFriendsDropdown();
	}

    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  }

  public static async deactivate2Fa() {
    const main = document.querySelector(".main-container") as HTMLElement;
    const user = userContext.state;
    try {
      const response = await fetch(`${CADDY_SERVER}/api/has-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!data.has2Fa) {
        throw data;
      }
      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
      main.insertAdjacentHTML(
        "beforeend",
        `
					<div class="${Profile.message2FaclassName} flex flex-col items-center gap-4 mb-12">
						<p>Please confirm the 2FA deactivation by sending your 6-digit code</p>
						<form class="flex gap-4 items-center">
						<label for="confirm-2fa">2FA Code</label>
						<input class="theme-input-${themeState.state} px-2 py-1" type="number" id="confirm-2fa" name="confirm-2fa" />
						<button type="submit" class="theme-btn-${themeState.state} submit-2fa-deactivation-btn py-1 cursor-pointer w-[80px]">Submit</button>
						</form>
					</div>
				`
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "has2Fa" in error &&
        !error.has2Fa
      ) {
        removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, 2FA is not activated!</p>`
        );
      } else {
        console.log(error);
      }
    }

    return;
  }

  public static async submit2FaCodeDeactivation(event: MouseEvent) {
    event.preventDefault();
    const user = userContext.state;
    const main = document.querySelector(".main-container") as HTMLElement;
    const input = document.getElementById("confirm-2fa") as HTMLInputElement;
    const code2Fa = input.value;
    try {
      const validationResponse = await fetch("/api/validate-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, code2Fa }),
        signal: AbortSignal.timeout(5000),
      });

      const validationData = await validationResponse.json();
      if (validationData.errorMessage) {
        throw validationData;
      }

      const response = await fetch(`${CADDY_SERVER}/api/deactivate-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
        signal: AbortSignal.timeout(5000),
      });

      await response.json();
      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
      main.insertAdjacentHTML(
        "beforeend",
        `<p class="deactive-2fa-message message-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, you successfully deactivated the 2FA.</p>`
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "errorMessage" in error &&
        error.errorMessage
      ) {
        removeElementsWithSimilarClassName("retry-submit-2fa", main);
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} retry-submit-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, ${error.errorMessage}</p>`
        );
      } else {
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="deactive-2fa-error-message message-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, Something went wrong!</p>`
        );
      }
      console.log(error);
    }
  }
}

export default Profile;
