import StateManager from "../models/StateManager";

export type ThemeType = "light" | "dark";

class ThemeContext extends StateManager<ThemeType> {
  constructor(initialState: ThemeType) {
    super(initialState);
  }

  public dispatchChangeTheme() {
    const newTheme = this.state;
    const previousTheme = newTheme === "light" ? "dark" : "light";
    const elements = document.querySelectorAll(`.theme-${previousTheme}`);
    for (const element of elements) {
      element.classList.remove(`theme-${previousTheme}`);
      element.classList.add(`theme-${newTheme}`);
    }
  }
}

const themeState = new ThemeContext("light");

export default themeState;
