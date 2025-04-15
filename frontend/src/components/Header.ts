import themeState, { ThemeType } from "../context/ThemeContext";
import { UrlStateType, urlContext } from "../context/UrlContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { StateListener } from "../models/StateManager";
import { NO_HIGHLIGHT_LINKS, PAGES, ROUTER_CLASS_NAME } from "../constants";
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
      `theme-secondary-${themeState.state}-full`,
      "h-18",
      "flex",
      "items-center",
      "layout-padding"
    );

    return HeaderInstance;
  }

  public static createChildren() {
    const html = `
			<nav class="grid grid-cols-[1fr_auto_1fr] align-items">
				<p>transcendence</p>
				<ul class="flex grow justify-center gap-10">
					<li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/">Home</a></li>
					${
            !userContext.state.isSignedIn
              ? `
							 <li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/sign-up">Sign up</a></li>
							 <li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/sign-in">Sign in</a></li>
							 `
              : ""
          }
					<li><a class="nav-link ${ROUTER_CLASS_NAME}" href="/pong">Pong</a></li>
				</ul>	
				<div class="flex items-center gap-10 justify-self-end">
					${
            userContext.state.isSignedIn
              ? `<a class="nav-link profile-link ${ROUTER_CLASS_NAME}" href="/profile">${
                  userContext.state.username ||
                  userContext.state.email ||
                  "profile"
                }</a>`
              : ""
          }
					<button class="bg-transparent theme-btn cursor-pointer">
              <img class='theme-icon w-[24px]' src='/src/assets/theme-${
                themeState.state === "light" ? "dark" : "light"
              }.png'
							/>
					</button>
				</div>
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
    if (
      target.classList.contains("theme-btn") ||
      target.classList.contains("theme-icon")
    ) {
      Header.handleChangeTheme(target);
    } else if (target.classList.contains("nav-link")) {
      Header.handleClickNavLink(target);
    } else if (target.classList.contains("profile-link")) {
      Header.handleNavigateToProfile();
    }
  }

  public static handleChangeTheme(target: HTMLElement) {
    const newTheme = themeState.state === "light" ? "dark" : "light";

    const newListener: StateListener<ThemeType> = {
      id: "changeTheme",
      listen: (previousTheme, newTheme) => {
        // if (previousTheme !== newTheme) {
        //   target.innerText = `${previousTheme}`;
        //   themeState.dispatchChangeTheme();
        // }
        if (previousTheme !== newTheme) {
          if (target.classList.contains("theme-icon")) {
            (
              target as HTMLImageElement
            ).src = `/src/assets/theme-${previousTheme}.png`;
          } else {
            target.innerHTML = `<img src=/src/assets/theme-${previousTheme}.png />`;
          }
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
    // console.log(urlContext.state.path);
    const noHighlightLink = NO_HIGHLIGHT_LINKS.find(
      link => link === urlContext.state.path
    );
    if (noHighlightLink) {
      return;
    }
    // const activeLink = document.querySelector(
    //   // `a[href="${window.location.pathname}"]`
    //   `a[href="${urlContext.state.path}"]`
    // );

    const header = document.querySelector("header-component");
    if (!header) {
      return;
    }
    console.log(urlContext.state.path);
    const activeLink = header.querySelector(
      `a[href="${urlContext.state.path}"]`
    );
    console.log("activeLink", activeLink);
    const newClassName =
      themeState.state === "light"
        ? "theme-ternary-light-foreground"
        : "theme-ternary-dark-foreground";
    activeLink?.classList.add(newClassName);
  }

  public static handleNavigateToProfile() {
    urlContext.setState({ ...urlContext.state, path: "/profile" });
  }
}

export default Header;
