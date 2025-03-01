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

  public static handleChangeTheme(target: HTMLElement) {
    const newTheme = themeState.state === "light" ? "dark" : "light";

    const newListener: StateListener<ThemeType> = {
      id: "changeTheme",
      listen: (previousTheme, newTheme) => {
        if (previousTheme !== newTheme) {
          target.innerText = `${previousTheme}`;
          themeState.dispatchChangeTheme();
        }
      },
    };

    themeState.subscribeListener(newListener);
    themeState.state = newTheme;
  }

  public static handleClickNavLink(target: HTMLElement) {
    target.classList.add("current-nav-link");
    console.log(target);
  }

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const targetClassName = "theme-btn";
    if (target.classList.contains(targetClassName)) {
      Header.handleChangeTheme(target);
    } else if (target.classList.contains("nav-link")) {
      console.log(target);
    }
  }

  public static createChildren() {
    const html = `
			<nav class="flex items-center">
				<p>transcendence</p>
				<ul class="flex grow justify-center gap-10">
					<li><a class="nav-link current-nav-link" href="/">Home</a></li>
					<li><a class="nav-link" href="/login">Login</a></li>
					<li><a class="nav-link" href="/pong">Pong</a></li>
				</ul>	
				<button class="${
          themeState.state === "light"
            ? "theme-ternary-light"
            : "theme-ternary-dark"
        } theme-btn px-4 py-2 cursor-pointer
				">${themeState.state === "light" ? "dark" : "light"}
				</button>
			</nav>
		`;

    const header = document.createElement("header");
    header.classList.add("grow");
    header.insertAdjacentHTML("beforeend", html);
    header.addEventListener("click", event => Header.handleClick(event));
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
      `${
        themeState.state === "light"
          ? "theme-secondary-light"
          : "theme-secondary-dark"
      }`,
      "h-18",
      "flex",
      "items-center",
      "layout-padding"
    );

    return HeaderInstance;
  }
}

export default Header;
