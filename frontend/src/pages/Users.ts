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
  is_friend: boolean;
  isSignedIn: boolean;
  onlineStatus: string;
  avatar: string;
}

type Match = {
  match_id: number;
  type: "local" | "remote" | "tournament";
  user_id_first: number;
  user_id_second: number;
  alias_first: string;
  alias_second: string;
  winner_alias?: string;
  winner_id?: number;
  tournament_id?: number;
  first_score?: number;
  second_score?: number;
  date: string;
};

type MatchWithSource = Match & { source: 'local' | 'remote' };

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
	let matches: MatchWithSource[] = [];
	if (user) {
	  const { localMatches, remoteMatches } = await Users.getUserMatches(user.id);
	  matches = [
		...localMatches.map(match => ({ ...match, source: 'local' as const })),
		...remoteMatches.map(match => ({ ...match, source: 'remote' as const }))
	  ];
	}
	const localTotal = matches.filter(match => match.source === 'local').length;
	const remoteMatchesForUser = matches.filter(m => m.source === 'remote' && (m.user_id_first === user?.id || m.user_id_second === user.id));
	const wins = remoteMatchesForUser.filter(m => m.winner_id === user?.id).length;
	const losses = remoteMatchesForUser.length - wins;
	const total = wins + losses;
	const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    let matchesHtml = '';

	if (user) {
	  if (matches.length === 0) {
		matchesHtml = `<section class="my-12"><p class="test-center my-8 text-gray-500">No match history found for ${user.username}.</p></section>`;
	  } else {
		matchesHtml = `
		<section class="my-12">
		  <h2 class="text-3xl font-bold mb-4 text-center">Match History</h2>

		  <div class="flex items-center justify-center gap-6 mb-6 text-center">
	        <div>
	          <div class="text-4xl font-bold text-green-600">${wins}</div>
	          <div class="text-sm text-gray-600">Wins</div>
	        </div>
	        <div>
	          <div class="text-4xl font-bold text-red-600">${losses}</div>
	          <div class="text-sm text-gray-600">Losses</div>
	        </div>
			<div>
	          <div class="text-4xl font-bold text-purple-600">${localTotal}</div>
	          <div class="text-sm text-gray-600">Local</div>
	        </div>
	      </div>

		  <div class="max-w-md mx-auto mb-6">
	        <div class="flex justify-between mb-1 text-sm font-medium text-gray-700">
	          <span>Win Rate</span>
	          <span>${winRate}%</span>
	        </div>
	        <div class="w-full bg-gray-300 rounded h-4">
	          <div class="bg-green-500 h-4 rounded" style="width: ${winRate}%;"></div>
	        </div>
	      </div>

		  <div class="flex flex-col gap-4 max-w-3xl mx-auto">
		    ${matches.map((match: MatchWithSource) => {
		      const userInMatch = user.id === match.user_id_first || user.id === match.user_id_second;
		      const userWon = userInMatch && match.winner_id === user.id;

			  let remoteClass = "";
		      if (match.source === 'remote' && userInMatch) {
		        remoteClass = userWon ? "bg-green-300" : "bg-red-300";
		      }
			  const baseClass = match.source === 'local' ? "bg-purple-300" : `theme-bg-${themeState.state}`;
		      const matchClass = match.source === 'remote' && userInMatch ? remoteClass : baseClass;
		      return `
		        <div class="p-4 border rounded-lg shadow-sm ${matchClass}">
		          <p>
		            <strong>${match.alias_first} [${match.first_score ?? 0}]</strong> vs 
		            <strong>${match.alias_second} [${match.second_score ?? 0}]</strong> — 
		            ${match.winner_alias ? `<strong>${match.winner_alias}</strong> WON the match` : "TBD"}
		            <span class="text-sm text-gray-500">(${new Date(match.date).toLocaleString()})</span>
		          </p>
		        </div>
		      `;
		    }).join('')}
		  </div>
		</section>
		`;
	  }
	}
    let html: string;
    if (!user) {
  const questionMarks = Array.from({ length: 25 }).map((_) => {
    const top = Math.floor(Math.random() * 90);   // % from top
    const left = Math.floor(Math.random() * 90);  // % from left
    const size = Math.floor(Math.random() * 24) + 12; // font size between 12px and 36px
    const opacity = (Math.random() * 0.5 + 0.3).toFixed(2); // between 0.3 and 0.8
    return `<span 
              class="absolute text-gray-400 select-none pointer-events-none"
              style="top:${top}%; left:${left}%; font-size:${size}px; opacity:${opacity};"
            >?</span>`;
  }).join('');

  matchesHtml = `
    <div class="relative w-full h-full min-h-screen overflow-hidden">
      ${questionMarks}
    </div>
  `;

  html = `
    <div class="flex items-center justify-center min-h-screen">
      <h1 class="text-4xl font-semibold text-center">
        User <span class="text-red-500">${searchTerm}</span> not found
      </h1>
    </div>
  `;
} else if (user.id == Number(userContext.state.id)) { // view yourslef
      html = `
        <div class="flex items-center justify-between mt-12 mb-6">
		  <h1 class="text-5xl font-bold">Your public profile</h1>
		</div>

		<div class="flex flex-col gap-1 mb-20">
		  <img
	        src=${CADDY_SERVER}/avatars/${user.avatar}
			alt="User's avatar"
		    class="w-24 h-24 object-cover rounded-full"
		  />
          <p>Email: ${user.email}</p>
		  </div>
		  `;
    } else if (user.is_friend)  { // be able to see online status / BLOCK
		html = `
        <div class="flex items-center justify-between mt-12 mb-6">
          <h1 class="text-5xl font-bold">
		    ${user.username}
		    <span class="text-base font-normal">${user.onlineStatus}</span>
		  </h1>
		</div>
			
	<div class="flex flex-col gap-1 mb-20">
	  <img
	    src=${CADDY_SERVER}/avatars/${user.avatar}
	    alt="User's avatar"
		class="w-24 h-24 object-cover rounded-full"
		/>
	  <p>Email: ${user.email}</p>
	</div>

	<div class="flex justify-between items-start mb-12">
	  <div>
	    <h2 class="text-3xl font-bold mb-6">Options</h2>
	    <div class="flex flex-col gap-2 w-[120px]">
		  <div class="flex items-center">
		    <button class="block-btn theme-btn-${themeState.state} px-4 py-2 cursor-pointer" data-userid="${user.id}">
		  	Block user
		    </button>
		    <span class="block-success hidden text-green-600">&#10003;</span>
	      </div>
	    </div>
	  </div>
	</div>
	`;
    } else {// be able to add friend / BLOCK
		html = `
        <div class="flex items-center justify-between mt-12 mb-6">
          <h1 class="text-5xl font-bold">${user.username}</h1>
		</div>
			
	<div class="flex flex-col gap-1 mb-20">
	  <img
	    src=${CADDY_SERVER}/avatars/${user.avatar}
	    alt="User's avatar"
		class="w-24 h-24 object-cover rounded-full"
		/>
	  <p>Email: ${user.email}</p>
	</div>

	<div class="flex justify-between items-start mb-12">
	  <div>
	    <h2 class="text-3xl font-bold mb-6">Options</h2>
	    <div class="flex flex-col gap-2 w-[200px]">

	      <div class="flex items-center">
	        <button class="friend-btn theme-btn-${themeState.state} px-4 py-2 cursor-pointer" data-userid="${user.id}">
	          Add friend
	        </button>
	        <span class="friend-success hidden text-green-600 ml-1">&#10003;</span>
	      </div>

	      <div class="flex items-center">
	        <button class="block-btn theme-btn-${themeState.state} px-4 py-2 cursor-pointer" data-userid="${user.id}">
	          Block user
	        </button>
	        <span class="block-success hidden text-green-600 ml-1">&#10003;</span>
	      </div>

	    </div>
	  </div>
	</div>
	`;
    }
    main.addEventListener("click", Users.handleClick);

	main.innerHTML = `
      <div class="flex min-h-screen">
        <div class="profile-info w-1/3 p-4">
          ${html}
        </div>
        <div class="matches-wrapper w-2/3 flex justify-start items-start p-4">
          ${matchesHtml}
        </div>
      </div>
    `;
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

  //green check after successful update of element
  private static showSuccess(action: "block" | "friend") {
  const successIndicator = document.querySelector(`.${action}-success`) as HTMLElement;
  if (successIndicator) {
    successIndicator.classList.remove("hidden");
    successIndicator.classList.add("animate-pulse");

    setTimeout(() => {
      successIndicator.classList.add("hidden");
      successIndicator.classList.remove("animate-pulse");
    }, 3000); // auto-hide after 3 seconds
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
	  Users.showSuccess("friend");
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
	  Users.showSuccess("block");
	} catch(error) {
	  console.error("Error sending friend request: ", error);
	  return null
	}
  }

  public static async getUserMatches(searchUserId: number, ): Promise<{ localMatches: Match[], remoteMatches: Match[] }> {
  try {
    const response = await fetch(`${CADDY_SERVER}/api/users/matches`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
	  body: JSON.stringify({ searchUserId })
    });
    if (!response.ok) {
	  console.warn("Failed to fetch matches for user ID:", searchUserId);
	  return { localMatches: [], remoteMatches: [] };
	};

    const data = await response.json();
	const localMatches = data.localMatches || [];
	const remoteMatches = data.remoteMatches || [];
	console.log("localMatches count:", localMatches.length);
    console.log("remoteMatches count:", remoteMatches.length);
	return { localMatches, remoteMatches };
  } catch (err) {
      console.error("Error fetching matches:", err);
      return { localMatches: [], remoteMatches: [] };
    }
  }
}

export default Users;
