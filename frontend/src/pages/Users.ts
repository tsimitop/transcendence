import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { CADDY_SERVER } from "../constants";

interface UserProfile {
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
        </div>
      `;
    }
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
	//   console.error("Response status:", response.status);
	// 	console.error("Response URL:", response.url);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
  			console.error("User search failed with status:", response.status);
  			console.error("Error detail:", errorData);
			return null;
		}
		const data = await response.json();
		return data.user;
    } catch (error) {
      console.error("Search failed: ", error);
    }
  }

}

export default Users;
