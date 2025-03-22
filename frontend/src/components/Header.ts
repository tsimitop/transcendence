import themeState, { ThemeType } from "../context/ThemeContext";
import { UrlStateType, urlContext } from "../context/UrlContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { StateListener } from "../models/StateManager";
import { PAGES, ROUTER_CLASS_NAME } from "../constants";
import { userContext } from "../context/UserContext";

class Header extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static create() {
    if (!customElements.getName(Header)) {
      customElements.define("header-component", Header);
    }
    const childElements = Header.createChildren();
    const HeaderInstance = new Header(
      { html: "", position: "beforeend" },
      {
        element: childElements,
        position: "beforeend",
      }
    );
    HeaderInstance.insertChildren();
    HeaderInstance.classList.add(
      `${
        themeState.state === "light"
          ? "theme-secondary-light-full"
          : "theme-secondary-dark-full"
      }`,
      "h-18",
      "flex",
      "items-center",
      "layout-padding"
    );

    return HeaderInstance;
  }

  public static createChildren() {
    const html = `
			<nav class="flex items-center">
				<p>transcendence</p>
				<ul class="flex grow justify-center gap-10">
					<li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/">Home</a></li>
					${
            !userContext.state.isSignedIn
              ? `<li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/sign-up">Sign up</a></li>`
              : ""
          }
					<li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/pong">Pong</a></li>
				</ul>	
				<button class="${
          themeState.state === "light"
            ? "theme-ternary-light-full"
            : "theme-ternary-dark-full"
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

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const targetClassName = "theme-btn";
    if (target.classList.contains(targetClassName)) {
      Header.handleChangeTheme(target);
    } else if (target.classList.contains("nav-link")) {
      Header.handleClickNavLink(target);
    }
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
    themeState.setState(newTheme);
  }

  public static handleClickNavLink(_target: HTMLElement) {
    void _target;

    const newListener: StateListener<UrlStateType> = {
      id: "changeUrl",
      listen(previousPath, newPath) {
        if (previousPath === newPath) {
          return;
        }
        Header.highlightActiveNavLink();
      },
    };

    urlContext.subscribeListener(newListener);
    const urlPath = window.location.pathname;
    const validPath = PAGES.find(page => page === urlPath);
    if (validPath) {
      urlContext.setState({ ...urlContext.state, path: validPath });
    } else {
      urlContext.setState({ ...urlContext.state, path: undefined });
    }
  }

  public static highlightActiveNavLink() {
    const activeLink = document.querySelector(
      // `a[href="${window.location.pathname}"]`
      `a[href="${urlContext.state.path}"]`
    );
    const newClassName =
      themeState.state === "light"
        ? "theme-ternary-light-foreground"
        : "theme-ternary-dark-foreground";
    activeLink?.classList.add(newClassName);
  }
}

export default Header;
