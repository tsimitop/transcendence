import Footer from "../components/Footer";
import Header from "../components/Header";
import { NGINX_SERVER } from "../constants";
import themeState from "../context/ThemeContext";
import { urlContext } from "../context/UrlContext";
import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import Router from "../models/Router";

type Activate2FaResponseType = {
  dataUrl: string;
};

class Profile extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("sign-out-btn")) {
      Profile.signOut();
    } else if (target.classList.contains("activate-2fa-btn")) {
      Profile.activate2Fa();
    } else if (target.classList.contains("confirm-2fa-btn")) {
      Profile.confirm2Fa();
    } else if (target.classList.contains("deactivate-2fa-btn")) {
      Profile.deactivate2Fa();
    }
  }

  public static async signOut() {
    try {
      // console.log("signing out");
      const response = await fetch(`${NGINX_SERVER}/api/sign-out`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!data.errorMessage) {
        userContext.setState({
          ...userContext.state,
          id: "",
          email: "",
          username: "",
          isSignedIn: false,
          jwtAccessToken: "",
        });
        const routeToGo = "/";
        urlContext.setState({ ...urlContext.state, path: routeToGo });
        window.history.pushState({}, "", routeToGo);
        await Router.redirect(routeToGo);
        // Header.highlightActiveNavLink();
      }
    } catch (error) {
      console.log(error);
    }
  }

  public static async activate2Fa() {
    const user = userContext.state;
    const page = document.querySelector(".main-container")!;
    try {
      const has2Fa = await Router.is2FaActive(user);
      if (has2Fa) {
        const note = page.querySelector(".already-active-2fa-notice");
        if (note) {
          page.removeChild(note);
        }
        page.insertAdjacentHTML(
          "beforeend",
          `<p class="already-active-2fa-notice theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, you have already activated 2FA!</p>`
        );
        return;
      }

      const response = await fetch(`${NGINX_SERVER}/api/activate-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      const data = (await response.json()) as Activate2FaResponseType;
      const { dataUrl } = data;

      const qrCode = page.querySelector(".qrcode");
      if (qrCode) {
        return;
      }
      page.insertAdjacentHTML(
        "beforeend",
        `
				<div class="qrcode">
					<img src=${dataUrl} width=200px alt=qrcode />
					<button class="confirm-2fa-btn theme-ternary-${themeState.state}-full px-4 py-2 cursor-pointer">
						Confirm 2FA Activation
					</button>
				</div>
				`
      );
    } catch (error) {
      console.log(error);
    }
  }

  public static async confirm2Fa() {
    const user = userContext.state;
    try {
      const response = await fetch(`${NGINX_SERVER}/api/confirm-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  public static create() {
    if (!customElements.getName(Profile)) {
      customElements.define("profile-component", Profile);
    }

    const main = document.createElement("main");
    main.classList.add(
      "main-container",
      "layout-padding",
      `${
        themeState.state === "light"
          ? "theme-primary-light-full"
          : "theme-primary-dark-full"
      }`
    );

    main.addEventListener("click", Profile.handleClick);

    const html = `
				<h1>Profile</h1>
				<p>id: ${userContext.state.id}</p>
				<p>email: ${userContext.state.email}</p>
				<p>username: ${userContext.state.username}</p>
				<button class="activate-2fa-btn theme-ternary-${themeState.state}-full px-4 py-2 cursor-pointer">
					Activate 2FA
				</button>
				<button class="deactivate-2fa-btn theme-ternary-${themeState.state}-full px-4 py-2 cursor-pointer">
					Deactivate 2FA
				</button>
				<button class="sign-out-btn theme-ternary-${themeState.state}-full px-4 py-2 cursor-pointer">
					Sign out
				</button>
			`;

    main.insertAdjacentHTML("beforeend", html);

    const SignOutInstance = new Profile(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignOutInstance.insertChildren();
    SignOutInstance.classList.add("page");

    return SignOutInstance;
  }

  public static async deactivate2Fa() {
    const user = userContext.state;
    const main = document.querySelector(".main-container")!;
    try {
      const response = await fetch(`${NGINX_SERVER}/api/deactivate-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();

      const note = main.querySelector(".deactived-2fa-notice");
      if (note) {
        main.removeChild(note);
      }
      main.insertAdjacentHTML(
        "beforeend",
        `<p class="deactived-2fa-notice theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, 2FA is deactivated!</p>`
      );
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }
}

export default Profile;
