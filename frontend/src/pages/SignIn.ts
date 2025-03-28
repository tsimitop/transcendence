import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
import { urlContext } from "../context/UrlContext";
import { userContext, UserStateType } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import Router from "../models/Router";

class SignIn extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static create() {
    if (!customElements.getName(SignIn)) {
      customElements.define("signin-component", SignIn);
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

    // main.addEventListener("click", SignIn.handleClick);
    main.addEventListener("submit", SignIn.handleSignIn);

    const html = `
				<h1>Sign In</h1>
				<form class="sign-in-form">
					<label for="username-or-email">Username or Email</label>
					<input required type="text" name="username-or-email" id="username-or-email" placeholder="username or email" class="username-signin-input border-2" />
					<label for="password">Password</label>
					<input required type="password" name="password" id="password" placeholder="password" class="password-signin-input border-2" />
					<button type="submit" class="signin-btn cursor-pointer border-2">Sign in</button>
					<p>
						<span>Don't have an account?</span>
						<a class=${ROUTER_CLASS_NAME} href="/sign-up">Sign up</a>
					</p>
				</form>
		`;

    main.insertAdjacentHTML("beforeend", html);

    const SignInInstance = new SignIn(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignInInstance.insertChildren();
    SignInInstance.classList.add("page");

    return SignInInstance;
  }

  // public static handleClick(event: MouseEvent) {
  //   const target = event.target as HTMLElement;
  //   if (target.classList.contains("signin-btn")) SignIn.handleSignIn(event);
  // }

  public static handleSignIn(event: SubmitEvent) {
    const target = event.target as HTMLFormElement;
    event.preventDefault();
    if (!target.className.includes("sign-in-form")) {
      return;
    }

    const usernameOrEmail = (
      document.querySelector(".username-signin-input") as HTMLInputElement
    ).value.trim();
    const password = (
      document.querySelector(".password-signin-input") as HTMLInputElement
    ).value.trim();

    if (!usernameOrEmail || !password) {
      console.log("field is reuqired");
      return;
    }

    SignIn.postSignInData(usernameOrEmail, password);
  }

  public static async postSignInData(
    usernameOrEmail: string,
    password: string
  ) {
    try {
      const response = await fetch("http://localhost:80/api/sign-in", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameOrEmail, password }),
        signal: AbortSignal.timeout(5000),
      });

      const data = (await response.json()) as {
        errorMessage: string;
        user: UserStateType | null;
        jwtAccessToken: string;
      };
      if (!data.user) {
        throw new Error("Invalid username or password");
      }
      const { email, username, isSignedIn } = data.user;
      if (!isSignedIn) {
        throw new Error("Invalid username or password");
      }
      userContext.setState({
        ...userContext.state,
        email,
        username,
        isSignedIn,
      });
      // console.log("userContext.state:\n", userContext.state);
      console.log(data);
      urlContext.setState({ ...urlContext.state, path: "/" });
      const viewToRender = Router.findViewToRender();
      Router.renderPageBasedOnPath(viewToRender);
      Router.removeRouteChangeListeners();
      Router.listenForRouteChange();
    } catch (error) {
      console.log(error);
    }
  }
}

export default SignIn;
