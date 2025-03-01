import themeState, { ThemeType } from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { StateListener } from "../models/StateManager";

class Header extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static createChildren() {
    const html = `
			<nav>
				<ul>
					<li><a href="/">Home</a></li>
					<li><a href="/login">Login</a></li>
					<li><a href="/pong">Pong</a></li>
				</ul>
				<button class="theme-btn ${
          themeState.state === "light"
            ? "theme-ternary-light"
            : "theme-ternary-dark"
        }">change theme to 
				${themeState.state === "light" ? "dark" : "light"}</button>
			</nav>
		`;

    const header = document.createElement("header");
    header.insertAdjacentHTML("beforeend", html);

    header.addEventListener("click", event => {
      const target = event.target as HTMLElement;
      const targetClassName = "theme-btn";
      if (target.classList.contains(targetClassName)) {
        const newTheme = themeState.state === "light" ? "dark" : "light";

        const newListener: StateListener<ThemeType> = {
          name: "changeTheme",
          listen: (previousTheme, newTheme) => {
            if (previousTheme !== newTheme) {
              target.innerText = `change theme to ${previousTheme}`;
              themeState.dispatchChangeTheme();
            }
          },
        };

        themeState.subscribeListener(newListener);
        themeState.state = newTheme;
      }
    });
    return header;
  }

  public static create() {
    if (!customElements.getName(Header)) {
      customElements.define("header-component", Header);
    }
    const childrenElements = Header.createChildren();
    const HeaderInstance = new Header(
      { html: "", position: "beforeend" },
      {
        element: childrenElements,
        position: "beforeend",
      }
    );
    HeaderInstance.insertChildren();
    HeaderInstance.classList.add(
      "h-24",
      `${
        themeState.state === "light"
          ? "theme-secondary-light"
          : "theme-secondary-dark"
      }`,
      "block"
    );

    return HeaderInstance;
  }
}

export default Header;
