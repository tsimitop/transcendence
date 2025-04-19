import Footer from "../components/Footer";
import Header from "../components/Header";
import { NGINX_SERVER } from "../constants";
import themeState from "../context/ThemeContext";
import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import Router from "../models/Router";

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
        await Router.redirect("/");
        // Header.highlightActiveNavLink();
      }
    } catch (error) {
      console.log(error);
    }
  }

  public static create() {
    if (!customElements.getName(Profile)) {
      customElements.define("signout-component", Profile);
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
}

export default Profile;
