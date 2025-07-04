import { CADDY_SERVER } from "../constants";
import StateManager from "../models/StateManager";
import { maybeStopChat, maybeStartChat } from "../main";

export type UserStateType = {
  id: string;
  email: string;
  username: string;
  isSignedIn: boolean;
  avatar: string;
  friends?: string[];
  blocked?: string[];
};

export type ValidateAccessTokenResponseType = {
  errorMessage: string;
  isRefreshTokenValid: boolean;
  isAccessTokenValid: boolean;
  isNewAccessTokenNeeded: boolean;
  isSignedIn: boolean;
  userId: string;
  email: string;
  username: string;
  avatar: string;
};

class UserContext extends StateManager<UserStateType> {
  constructor(state: UserStateType) {
    super(state);
  }

  public async isUserSignedIn() {
    try {
      const response = await fetch(
        `${CADDY_SERVER}/api/validate-access-token`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: this.state }),
          signal: AbortSignal.timeout(5000),
        }
      );
      const data = (await response.json()) as ValidateAccessTokenResponseType;
      return data;
    } catch (error) {
      // console.log(error);
      return null;
    }
  }
  public override setState(newState: UserStateType) {
	const wasSignedIn = this.state.isSignedIn;
	super.setState(newState);
	const willBeSignedIn = newState.isSignedIn;
	
	if (!willBeSignedIn && wasSignedIn) {
	  maybeStopChat();
	}
	if (willBeSignedIn && !wasSignedIn) {
	  maybeStartChat();
	}
  }
}

export const userContext = new UserContext({
  id: "",
  email: "",
  username: "",
  isSignedIn: false,
  avatar: "",
});

export async function refreshRelations(): Promise<void> {
  try {
    const resFriends = await fetch(`${CADDY_SERVER}/api/friends/list`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userState: userContext.state }),
    });
    const friendsData = await resFriends.json();

    const resBlocked = await fetch(`${CADDY_SERVER}/api/friends/blocked`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userState: userContext.state }),
    });
    const blockedData = await resBlocked.json();

    userContext.setState({
      ...userContext.state,
      friends: friendsData.friends || [],
      blocked: blockedData.blockedUsernames || [],
    });

	    const profileComponent = document.querySelector("profile-component");
    if (profileComponent) {
      import("../pages/Profile").then((ProfileModule) => {
        const Profile = ProfileModule.default;
        Profile.friendList?.();
        Profile.blockedList?.();
        Profile.fetchAndRenderFriendRequests?.();
      });
    }
  } catch (err) {
    console.error("Failed to refresh user relations:", err);
  }
}


export default UserContext;
