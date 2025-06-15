import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { CADDY_SERVER } from "../constants";
import { userContext } from "../context/UserContext";
import DOMPurify from 'dompurify';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_friend: boolean;
  isSignedIn: boolean;
  onlineStatus: string;
  avatar: string;
}

class Users extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static async create() {
    if (!customElements.getName(Users)) {
      customElements.define("users-component", Users);
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
	const connectedUsersArray = await Users.getConnectedUsers();
    const userSearchInput = document.getElementById('user-searched') as HTMLInputElement;
    const searchTerm = userSearchInput?.value.trim();
    const searchLink = document.getElementById('search-link');
	const isUserConnected = connectedUsersArray?.includes(searchTerm);
	const user = await Users.search(searchLink, isUserConnected);
    let html: string;
    if (!user) {
      const safeSearchTerm = DOMPurify.sanitize(searchTerm || "");
      html = `
        <h1>User ${safeSearchTerm} not found</h1>
      `;
    } else if (user.id == Number(userContext.state.id)) { // view yourslef
      const safeEmail = DOMPurify.sanitize(user.email || "");
      const safeAvatar = DOMPurify.sanitize(user.avatar || "");
      html = `
        <div class="user-profile">
          <h2>Your public profile</h2>
		  <img
	        src=${CADDY_SERVER}/avatars/${safeAvatar}
		    class="w-24 h-24 object-cover rounded-full"
		  />
          <p>Email: ${safeEmail}</p>
		  </div>
		  `;
    } else if (user.is_friend)  { // be able to see online status / BLOCK
		const safeUsername = DOMPurify.sanitize(user.username || "");
		const safeEmail = DOMPurify.sanitize(user.email || "");
		const safeAvatar = DOMPurify.sanitize(user.avatar || "");
		const safeOnlineStatus = DOMPurify.sanitize(user.onlineStatus || "");
		html = `
        <div class="flex items-center justify-between mt-12 mb-6">
          <h1 class="text-5xl font-bold">
		    ${safeUsername}
		    <span class="text-base font-normal">(${safeOnlineStatus})</span>
		  </h1>
		</div>

	<div class="flex flex-col gap-1 mb-20">
	  <img
	    src=${CADDY_SERVER}/avatars/${safeAvatar}
	    alt="User's avatar"
		class="w-24 h-24 object-cover rounded-full"
		/>
	  <p>Email: ${safeEmail}</p>
	</div>

	<div class="flex justify-between items-start mb-12">
	  <div>
	    <h2 class="text-3xl font-bold mb-6">Options</h2>
	    <div class="flex flex-col gap-2 w-[120px]">
		  <button class="block-btn theme-btn-${themeState.state} px-4 py-2 cursor-pointer" data-userid="${user.id}">
			Block user
		  </button>
	    </div>
	  </div>
	</div>
	`;
    } else {// be able to add friend / BLOCK
		const safeUsername = DOMPurify.sanitize(user.username || "");
		const safeEmail = DOMPurify.sanitize(user.email || "");
		const safeAvatar = DOMPurify.sanitize(user.avatar || "");
		html = `
        <div class="flex items-center justify-between mt-12 mb-6">
          <h1 class="text-5xl font-bold">${safeUsername}</h1>
		</div>

	<div class="flex flex-col gap-1 mb-20">
	  <img
	    src=${CADDY_SERVER}/avatars/${safeAvatar}
	    alt="User's avatar"
		class="w-24 h-24 object-cover rounded-full"
		/>
	  <p>Email: ${safeEmail}</p>
	</div>

	<div class="flex justify-between items-start mb-12">
	  <div>
	    <h2 class="text-3xl font-bold mb-6">Options</h2>
	    <div class="flex flex-col gap-2 w-[120px]">
		  <button class="friend-btn theme-btn-${themeState.state} px-4 py-2 cursor-pointer" data-userid="${user.id}">
			Add friend
		  </button>
		  <button class="block-btn theme-btn-${themeState.state} px-4 py-2 cursor-pointer" data-userid="${user.id}">
			Block user
		  </button>
	    </div>
	  </div>
	</div>
	`;
    }
    main.addEventListener("click", Users.handleClick);

    main.insertAdjacentHTML("beforeend", html);
    const usersInstance = new Users(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
	  { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    usersInstance.insertChildren();
    usersInstance.classList.add("page");
    return usersInstance;
  }

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("friend-btn")) {
      Users.friendRequest(event);
    } else if (target.classList.contains("block-btn")) {
      Users.blockingUser(event);
    }
  }

  public static async getConnectedUsers(): Promise<string[] | null>{
    const response = await fetch(`${CADDY_SERVER}/api/users`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok){
  	  return null;
    }
    const data = await response.json();
    return data.connectedUsersArray as string[];
  }

  public static async search(searchLink: any, isUserConnected: boolean | undefined): Promise<UserProfile | null | undefined> {
	const userState = userContext.state;
	if (!searchLink) {
	  console.error("searchLink not found.");
	  return null;
	}
	const url = new URL(searchLink.href);
	const searchTerm = url.searchParams.get("query");
	if (!searchTerm) {
	  console.error("No search term found on button.");
   	  return null;
	}
	console.log("Extracted searchTerm:", searchTerm);
    try {		
      const response = await fetch(`${CADDY_SERVER}/api/users`, {
        method: "POST",
		headers: {
        "Content-Type": "application/json",
		"Accept": "application/json"
      },
        credentials: "include",
		body: JSON.stringify({ userState, searchTerm, isUserConnected }),
      });
		if (!response.ok) {
		  const errorData = await response.json().catch(() => ({}));
  		  console.log("User search failed with status:", response.status);
  		  console.log("Error detail:", errorData);
		  return null;
		}
		const data = await response.json();
		return data.user;
    } catch (error) {
      console.error("Search failed: ", error);
	  return null;
    }
  }

  public static async friendRequest(event: MouseEvent){
	const userState = userContext.state;
	const target = event.target as HTMLElement;
	const userIdBtn = target?.getAttribute("data-userid");
	if (!userIdBtn) {
	  console.error("User ID not found on friend button.: " + userIdBtn);
	  return;
	}
	try {
	  const response = await fetch(`${CADDY_SERVER}/api/friends`, {
	    method: "POST",
	    headers: {
	      "Content-Type": "application/json",
	      "Accept": "application/json"
	    },
	    credentials: "include",
	    body: JSON.stringify({ userState, userIdBtn: parseInt(userIdBtn)})
	  });
	  if (!response.ok){
		  const error = await response.json().catch(() => ({}));
		  console.error("Failed to find friend", error)
	  	return null;
	  }
	} catch(error) {
		console.error("Error sending friend request: ", error);
		return null
	}
  }
  public static async blockingUser(event: MouseEvent){
	const userState = userContext.state;
	const target = event.target as HTMLElement;
	const userIdBtn = target?.getAttribute("data-userid");
	if (!userIdBtn) {
	  console.error("User ID not found on friend button.: " + userIdBtn);
	  return;
	}
	try {
	  const response = await fetch(`${CADDY_SERVER}/api/friends/block`, {
	    method: "POST",
	    headers: {
	      "Content-Type": "application/json",
	      "Accept": "application/json"
	    },
	    credentials: "include",
	    body: JSON.stringify({ userState, userIdBtn: parseInt(userIdBtn)})
	  });
	  if (!response.ok)
	  	return null;
	} catch(error) {
	  console.error("Error sending friend request: ", error);
	  return null
	}
  }
}

export default Users;
