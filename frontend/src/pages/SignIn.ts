import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
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
    main.addEventListener("click", SignIn.handleClick);

    const redirectUri = "http://localhost:3000/api/oauth";
    const clientId =
      "670502424156-2ovamqt7kp3opso8mfgm6mua81rq8vas.apps.googleusercontent.com";
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const state =
      Math.random().toString(36).substring(2) +
      Date.now().toString() +
      Math.random().toString(36).substring(2);
    const url = `${baseUrl}?response_type=code&client_id=${clientId}&scope=openid%20email&redirect_uri=${redirectUri}&state=${state}`;

    document.cookie = `oauth_state=${state}; secure=true; HttpOnly: true; SameSite=None; path=/api`;

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
						<a class="${ROUTER_CLASS_NAME}" href="/sign-up">Sign up</a>
					</p>
				</form>
				<button class="google-sign-in-btn cursor-pointer border-2"><a href=${url}>Sign in with Google</a></button>
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
      const { id, email, username, isSignedIn } = data.user;
      const { jwtAccessToken } = data;
      if (!isSignedIn) {
        throw new Error("Invalid username or password");
      }
      userContext.setState({
        ...userContext.state,
        id,
        email,
        username,
        isSignedIn,
        jwtAccessToken: jwtAccessToken,
      });
      // console.log("userContext.state:\n", userContext.state);
      // console.log(data);
      await Router.redirect("/");
      // Header.highlightActiveNavLink();
    } catch (error) {
      console.log(error);
    }
  }

  // public static async handleClick(event: MouseEvent) {
  //   super.handleClick(event);

  //   const target = event.target as HTMLElement;
  //   if (target.classList.contains("google-sign-in-btn")) {
  //     console.log("google auth");
  //     const googleRedirectUri = "http://localhost:80/api/google-auth";
  //     const googleClientId =
  //       "670502424156-2ovamqt7kp3opso8mfgm6mua81rq8vas.apps.googleusercontent.com";
  //     const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  //     const url = `${baseUrl}?response_type=code&client_id=${googleClientId}&scope=openid%20email&redirect_uri=${googleRedirectUri}`;
  //     try {
  //       const response = await fetch(url);
  //       const data = await response.json();
  //       console.log(data);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  // }
}

export default SignIn;
