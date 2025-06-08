import Footer from "../components/Footer";
import Header from "../components/Header";
import { CADDY_SERVER, ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
import { userContext, UserStateType } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import Router from "../models/Router";
import { displayFormValidationError } from "../utils/display-form-validation-error";

class SignIn extends Component {
  static validationErrorClassName = "sign-in-validation-error";
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
    const formAndValidationErrorContainer = document.createElement("div");
    formAndValidationErrorContainer.classList.add(
      "form-and-validation-container",
      "grid",
      "grid-rows-[auto_80px]",
      "grid-cols-[550px]"
    );
    main.insertAdjacentElement("afterbegin", formAndValidationErrorContainer);
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

    main.addEventListener("submit", SignIn.handleSignIn);
    main.addEventListener("click", SignIn.handleClick);

    const html = `
			<div class="flex flex-col gap-8">
				<form class="sign-in-form flex flex-col gap-6">
					<div class="grid grid-cols-[150px_400px] items-center">
						<label for="username-or-email">Username or Email</label>
						<input required type="text" name="username-or-email" id="username-or-email" placeholder="username or email" class="theme-input-${themeState.state} username-signin-input px-2 py-1" />
					</div>
					<div class="grid grid-cols-[150px_400px] items-center">
						<label for="password">Password</label>
						<input required type="password" name="password" id="password" placeholder="password" class="theme-input-${themeState.state} password-signin-input px-2 py-1" />
					</div>
					<div class="flex items-end mt-3">
						<p>
							<span class="text-sm">Don't have an account?</span>
							<a class="${ROUTER_CLASS_NAME} text-xs underline hover:no-underline" href="/sign-up">Sign up &rarr;
							</a>
						</p>
						<button type="submit" class="theme-btn-${themeState.state} signin-btn cursor-pointer block ml-auto mr-0 px-6 py-2">Sign in</button>
					</div>
				</form>
				<button class="theme-btn-${themeState.state} google-sign-in-btn cursor-pointer w-full py-2 flex items-center justify-center">
						<span class="google-sign-in-btn">Sign in with Google 
							<img src=/google-icon-${themeState.state}.png alt=google class="google-icon google-sign-in-btn w-[24px] inline" />
						</span>
					</a>
				</button>
			</div>
		`;

    formAndValidationErrorContainer.insertAdjacentHTML("beforeend", html);

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
      const formAndValidationErrorContainer = document.querySelector(
        ".form-and-validation-container"
      ) as HTMLElement;
      const errorMessage = "Username or password cannot be only whitespace";
      displayFormValidationError(
        SignIn.validationErrorClassName,
        formAndValidationErrorContainer,
        errorMessage
      );

      return;
    }

    SignIn.postSignInData(usernameOrEmail, password);
  }

  public static async postSignInData(
    usernameOrEmail: string,
    password: string
  ) {
    try {
      const response = await fetch(`${CADDY_SERVER}/api/sign-in`, {
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
        throw data;
      }

      const { id, email, username, isSignedIn } = data.user;
      if (data.errorMessage.includes("2FA")) {
        userContext.setState({
          ...userContext.state,
          id,
          email,
          username,
          isSignedIn,
          jwtAccessToken: "",
        });
        const routeToGo = "/2fa";
        // urlContext.setState({ ...urlContext.state, path: routeToGo });
        // window.history.pushState({}, "", routeToGo);
        const viewToRender = await Router.findViewToRender(routeToGo);
        Router.renderPageBasedOnPath(viewToRender);
        Header.highlightActiveNavLink();
        Router.listenForRouteChange();
        Router.handleBackAndForward();
        return;
      }
      const { jwtAccessToken: _ } = data;
      if (!isSignedIn) {
        throw data;
      }
      userContext.setState({
        ...userContext.state,
        id,
        email,
        username,
        isSignedIn,
        jwtAccessToken: "",
      });
      await Router.redirect("/");
    } catch (error) {
      const formAndValidationErrorContainer = document.querySelector(
        ".form-and-validation-container"
      ) as HTMLElement;

      const errorMessage = `${
        error &&
        typeof error === "object" &&
        "errorMessage" in error &&
        typeof error.errorMessage === "string"
          ? error.errorMessage
          : "Invalid input!"
      }`;

      displayFormValidationError(
        SignIn.validationErrorClassName,
        formAndValidationErrorContainer,
        errorMessage
      );

      console.log(error);
    }
  }

  public static async handleClick(event: MouseEvent) {
    super.handleClick(event);

    const target = event.target as HTMLElement;
    if (target.classList.contains("google-sign-in-btn")) {
      const oauthUrl = (await SignIn.requestToGenerateStateForOAuth()) as {
        url: string;
      } | null;
      if (oauthUrl) {
        window.location.href = oauthUrl.url;
      } else {
        console.log("Error in generating OAuth URL");
      }
    }
  }

  public static async requestToGenerateStateForOAuth() {
    try {
      const response = await fetch(`${CADDY_SERVER}/api/generate-state`, {
        credentials: "include",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

export default SignIn;
