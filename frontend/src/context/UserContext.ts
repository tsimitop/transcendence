import StateManager from "../models/StateManager";

export type UserStateType = {
  id: string;
  email: string;
  username: string;
  isSignedIn: boolean;
};

class UserContext extends StateManager<UserStateType> {
  constructor(state: UserStateType) {
    super(state);
  }
}

export const userContext = new UserContext({
  id: "",
  email: "",
  username: "",
  isSignedIn: false,
});

export default UserContext;
