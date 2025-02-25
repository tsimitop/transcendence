import themeState, { ThemeType } from "../context/ThemeContext";
import Component from "../models/Component";
import { StateListener } from "../models/StateManager";

class Home extends Component {
  constructor(
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ) {
    super(childrenString, childrenElements);
  }

  static create(): Home {
    if (!customElements.getName(Home)) {
      customElements.define("home-component", Home);
    }
    const h1 =
      "<h1 class='theme-light text-center text-blue-900'>Homepage</h1>";
    const loginLink = document.createElement("a");
    loginLink.href = "/login";
    loginLink.innerText = "To Login";
    loginLink.classList.add("font-bold");
    const gameLink = document.createElement("a");
    gameLink.href = "/pong";
    gameLink.innerText = "To Pong";
    gameLink.classList.add("font-bold");
    const themeBtn = document.createElement("button");
    themeBtn.innerText = `change theme to ${
      themeState.state === "light" ? "dark" : "light"
    }`;

    themeBtn.addEventListener("click", () => {
      const newTheme = themeState.state === "light" ? "dark" : "light";
      const newListener: StateListener<ThemeType> = {
        name: "changeTheme",
        listen: (previousTheme, newTheme) => {
          if (previousTheme !== newTheme) {
            themeBtn.innerText = `change theme to ${previousTheme}`;
            themeState.dispatchChangeTheme();
          }
        },
      };

      themeState.subscribeListener(newListener);
      themeState.state = newTheme;
    });
    themeBtn.classList.add(
      "bg-blue-900",
      "p-2",
      "text-stone-100",
      "hover:bg-sky-700",
      "hover:cursor-pointer"
    );
    const header = document.createElement("div");
    const nav = document.createElement("nav");
    nav.append(loginLink, gameLink);
    nav.classList.add("flex", "gap-4", "theme-light");
    header.append(nav, themeBtn);
    const HomeInstance = new Home(h1, header);
    HomeInstance.renderChildren("beforeend");
    return HomeInstance;
  }
}

export default Home;
