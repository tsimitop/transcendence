import StateManager from "../models/StateManager";

export type ThemeType = "light" | "dark";

class ThemeContext extends StateManager<ThemeType> {
  constructor(initialState: ThemeType) {
    super(initialState);
  }
}

const themeState = new ThemeContext("light");

export default themeState;
