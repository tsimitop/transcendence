import StateManager from "../models/StateManager";

export type ThemeType = "light" | "dark";

class ThemeContext extends StateManager<ThemeType> {
  constructor(initialState: ThemeType) {
    super(initialState);
  }

  public dispatchChangeTheme() {
    const newTheme = this.state;
    const previousTheme = newTheme === "light" ? "dark" : "light";
    const primaryElements = document.querySelectorAll(
      `.theme-primary-${previousTheme}`
    );
    for (const primaryElement of primaryElements) {
      primaryElement.classList.remove(`theme-primary-${previousTheme}`);
      primaryElement.classList.add(`theme-primary-${newTheme}`);
    }

    const secondaryElements = document.querySelectorAll(
      `.theme-secondary-${previousTheme}`
    );
    for (const secondaryElement of secondaryElements) {
      secondaryElement.classList.remove(`theme-secondary-${previousTheme}`);
      secondaryElement.classList.add(`theme-secondary-${newTheme}`);
    }
  }
}

const themeState = new ThemeContext("light");

export default themeState;
