import StateManager from "../models/StateManager";

type UserStateType = {
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
  email: "",
  username: "",
  isSignedIn: false,
});

export default UserContext;
