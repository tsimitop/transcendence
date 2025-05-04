import { CADDY_SERVER } from "../constants";
import StateManager from "../models/StateManager";

export type UserStateType = {
  id: string;
  email: string;
  username: string;
  isSignedIn: boolean;
  jwtAccessToken: string;
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
            Authorization: `Bearer ${this.state.jwtAccessToken}`,
          },
          body: JSON.stringify({ user: this.state }),
          signal: AbortSignal.timeout(5000),
        }
      );
      const data = (await response.json()) as ValidateAccessTokenResponseType;
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

export const userContext = new UserContext({
  id: "",
  email: "",
  username: "",
  isSignedIn: false,
  jwtAccessToken: "",
});

export default UserContext;
