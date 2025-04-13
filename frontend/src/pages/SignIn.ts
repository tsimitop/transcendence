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
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
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
    const url = `${baseUrl}?response_type=code&client_id=${clientId}&scope=openid%20email&redirect_uri=${redirectUri}&state=${state}&access_type=offline&prompt=consent`;

    document.cookie = `oauth_state=${state}; secure=true; SameSite=None; path=/api`;

    const html = `
			<div class="flex flex-col gap-8">
				<h1>Sign in</h1>
				<form class="sign-in-form flex flex-col gap-3">
					<div class="grid grid-cols-[150px_1fr] items-center">
						<label for="username-or-email">Username or Email</label>
						<input required type="text" name="username-or-email" id="username-or-email" placeholder="username or email" class="${
              themeState.state === "light"
                ? "theme-input-light"
                : "theme-input-dark"
            } username-signin-input w-80 px-2 py-1" />
					</div>
					<div class="grid grid-cols-[150px_1fr] items-center">
						<label for="password">Password</label>
						<input required type="password" name="password" id="password" placeholder="password" class="${
              themeState.state === "light"
                ? "theme-input-light"
                : "theme-input-dark"
            } password-signin-input px-2 py-1" w-80 />
					</div>
					<button type="submit" class="${
            themeState.state === "light" ? "theme-btn-light" : "theme-btn-dark"
          } signin-btn cursor-pointer block ml-auto mr-0 px-6 py-1">Sign in</button>
					<p>
						<span>Don't have an account?</span>
						<a class="${ROUTER_CLASS_NAME}" href="/sign-up">Sign up</a>
					</p>
				</form>
				<button class="${
          themeState.state === "light" ? "theme-btn-light" : "theme-btn-dark"
        } google-sign-in-btn cursor-pointer w-full py-1 flex items-center">
				 	<a class="w-full block" href=${url}>
						<span>Sign in with Google 
							<img src=/src/assets/google-icon-${
                themeState.state
              }.png class="google-icon w-[24px] inline" />
						</span>
					</a>
				</button>
			</div>
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
      await Router.redirect("/");
    } catch (error) {
      console.log(error);
    }
  }
}

export default SignIn;
