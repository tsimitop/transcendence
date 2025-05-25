import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { CADDY_SERVER } from "../constants";
import { userContext } from "../context/UserContext";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
}

// structure the user object to include only public-facing fields (avoid passwords, 
// tokens, etc., include stats, names, email?, online status if friend, friend list of others?).

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

    const userSearchInput = document.getElementById('user-searched') as HTMLInputElement;
    const searchTerm = userSearchInput?.value.trim();
    const searchLink = document.getElementById('search-link');
	const user = await Users.search(searchLink);
    let html: string;

    if (!user) {
      html = `
        <h1>User ${searchTerm} not found</h1>
      `;
    } else {
      html = `
        <div class="user-profile">
          <h2>${user.username}'s public profile</h2>
          <p>Email: ${user.email}</p>
          <p>Nickname: ${user.nickname || "N/A"}</p>
          <img src="${user.avatar || "/default-profile.png"}" alt="User's avatar" class="rounded w-[100px] h-[100px]" />
		  <button id="friend-btn" class="friend-btn" style="cursor: pointer;" data-userid="${user.id}">Add friend</button> 
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
    }
  }

  public static async search(searchLink: any): Promise<UserProfile | null | undefined> {
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
		body: JSON.stringify({ searchTerm }),
      });
		if (!response.ok) {
			// const errorData = await response.json().catch(() => ({}));
  			// console.log("User search failed with status:", response.status);
  			// console.log("Error detail:", errorData);
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
	const user = userContext.state;
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
			body: JSON.stringify({ user, userIdBtn: parseInt(userIdBtn)})
		});
		if (!response.ok) {
			// const error = await response.json().catch(() => ({}));
			// console.error("target: ", target)
			// console.error("userIdBtn: ", userIdBtn)
			// console.error("user: ", user)
			// console.error("response: ", response)
			// console.error("response.body: ", response.body)
			// console.error("Failed to find friend", error)
			return null;
		}
	} catch(error) {
		console.error("Error sending friend request: ", error);
		return null
	}
  }
}

export default Users;
