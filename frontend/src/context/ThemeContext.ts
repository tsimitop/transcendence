import StateManager from "../models/StateManager";

export type ThemeType = "light" | "dark";

class ThemeContext extends StateManager<ThemeType> {
  constructor(state: ThemeType) {
    super(state);
  }

  public dispatchChangeTheme() {
    const newTheme = this.state;
    const previousTheme = newTheme === "light" ? "dark" : "light";

    const primaryElements = document.querySelectorAll(
      `.theme-primary-${previousTheme}-full`
    );
    for (const primaryElement of primaryElements) {
      primaryElement.classList.remove(`theme-primary-${previousTheme}-full`);
      primaryElement.classList.add(`theme-primary-${newTheme}-full`);
    }

    const secondaryElements = document.querySelectorAll(
      `.theme-secondary-${previousTheme}-full`
    );
    for (const secondaryElement of secondaryElements) {
      secondaryElement.classList.remove(
        `theme-secondary-${previousTheme}-full`
      );
      secondaryElement.classList.add(`theme-secondary-${newTheme}-full`);
    }

    const ternaryElements = document.querySelectorAll(
      `.theme-ternary-${previousTheme}-full`
    );
    for (const ternaryElement of ternaryElements) {
      ternaryElement.classList.remove(`theme-ternary-${previousTheme}-full`);
      ternaryElement.classList.add(`theme-ternary-${newTheme}-full`);
    }

    const ternaryElementsForeground = document.querySelectorAll(
      `.theme-ternary-${previousTheme}-foreground`
    );
    for (const ternaryElementForeground of ternaryElementsForeground) {
      ternaryElementForeground.classList.remove(
        `theme-ternary-${previousTheme}-foreground`
      );
      ternaryElementForeground.classList.add(
        `theme-ternary-${newTheme}-foreground`
      );
    }

    const inputs = document.querySelectorAll(`.theme-input-${previousTheme}`);
    for (const input of inputs) {
      input.classList.remove(`theme-input-${previousTheme}`);
      input.classList.add(`theme-input-${newTheme}`);
    }

    const btns = document.querySelectorAll(`.theme-btn-${previousTheme}`);
    for (const btn of btns) {
      btn.classList.remove(`theme-btn-${previousTheme}`);
      btn.classList.add(`theme-btn-${newTheme}`);
    }

    const googleIcon = document.querySelector(".google-icon");
    if (googleIcon) {
      (googleIcon as HTMLImageElement).src = `/google-icon-${newTheme}.png`;
    }
  }
}

const themeState = new ThemeContext("light");

export default themeState;
