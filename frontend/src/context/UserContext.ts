import StateManager from "../models/StateManager";

export type UserStateType = {
  id: string;
  email: string;
  username: string;
  isSignedIn: boolean;
  jwtAccessToken: string;
};

export type AuthCheckType = {
  errorMessage: string;
  isRefreshTokenValid: boolean;
  isAccessTokenValid: boolean;
  isNewAccessTokenNeeded: boolean;
  encoded: object | null;
  refreshtoken: string;
  hashedRefreshToken: string;
};

class UserContext extends StateManager<UserStateType> {
  constructor(state: UserStateType) {
    super(state);
  }

  public async isUserSignedIn() {
    try {
      const response = await fetch(
        "http://localhost:80/api/validate-access-token",
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
      const data = (await response.json()) as AuthCheckType;
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
