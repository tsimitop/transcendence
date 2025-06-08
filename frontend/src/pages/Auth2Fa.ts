import Footer from "../components/Footer";
import Header from "../components/Header";
import { CADDY_SERVER } from "../constants";
import themeState from "../context/ThemeContext";
import { urlContext } from "../context/UrlContext";
import { userContext } from "../context/UserContext";
import Component from "../models/Component";
import Router from "../models/Router";
import { displayFormValidationError } from "../utils/display-form-validation-error";
import Profile from "./Profile";
import { maybeStartChat } from "../main";

class Auth2Fa extends Component {
  static validationErrorClassName = "code-2fa-error";
  public static create() {
    if (!customElements.getName(Auth2Fa)) {
      customElements.define("auth2fa-component", Auth2Fa);
    }

    const main = document.createElement("main");
    const formAndValidationErrorContainer = document.createElement("div");
    formAndValidationErrorContainer.classList.add(
      "form-and-validation-container",
      "grid",
      "grid-rows-[auto_80px]",
      "grid-cols-[500px]"
    );
    main.insertAdjacentElement("afterbegin", formAndValidationErrorContainer);
    main.insertAdjacentHTML(
      "afterbegin",
      `
			<h1 class="text-4xl">Hi <span class="font-bold">${userContext.state.username}</span></h1>
			`
    );
    main.classList.add(
      "flex",
      "flex-col",
      "gap-20",
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

    main.addEventListener("click", Auth2Fa.handleClick);

    const html = `
			<div class="flex flex-col gap-8">
				<form class="sign-in-form flex flex-col gap-3">
					<div class="grid grid-cols-[100px_400px] items-center">
						<label for="2fa-code">2FA code</label>
						<input required type="number" name="2fa-code" id="2fa-code" placeholder="6-digit code" class="theme-input-${themeState.state} code-2fa-input px-2 py-1" />
					</div>
					<div class="flex justify-end gap-3 mt-3">
						<button type="button" class="theme-btn-secondary-${themeState.state} cancel-2fa-btn cursor-pointer block px-6 py-2 w-[90px] flex justify-center">Cancel</button>
						<button type="submit" class="theme-btn-${themeState.state} code-2fa-btn cursor-pointer block px-6 py-2 w-[90px] flex justify-center">Submit</button>
					</div>
				</form>
			</div>
			`;

    formAndValidationErrorContainer.insertAdjacentHTML("beforeend", html);

    const SignOutInstance = new Auth2Fa(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignOutInstance.insertChildren();
    SignOutInstance.classList.add("page");

    return SignOutInstance;
  }

  public static async handleClick(event: MouseEvent) {
    event.preventDefault();
    const target = event.target as HTMLElement;
    if (target.classList.contains("cancel-2fa-btn")) {
      await Profile.signOut();
    } else if (target.classList.contains("code-2fa-btn")) {
      const code2Fa = (
        document.querySelector(".code-2fa-input") as HTMLInputElement
      ).value;
      Auth2Fa.validate2Fa(code2Fa);
    }
  }

  public static async validate2Fa(code2Fa: string) {
    const user = userContext.state;
    try {
      const response = await fetch(`${CADDY_SERVER}/api/validate-2fa`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, code2Fa }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      if (data.errorMessage || data.error) {
        console.log(data);
        // throw new Error("Wrong 2FA code!");
        throw data;
      }
	const routeToGo = "/profile";
	urlContext.setState({ ...urlContext.state, path: routeToGo });
	window.history.pushState({}, "", routeToGo);
	const { jwtAccessToken, user: validuser } = data;
	if (!validuser || !jwtAccessToken) {
		throw new Error("Invalid response from server: user or token missing");
	  }
	userContext.setState({
	id: validuser.id,
	email: validuser.email,
	username: validuser.username,
	jwtAccessToken: "",
	isSignedIn: true,
	});
	await maybeStartChat();
	const viewToRender = await Router.findViewToRender(routeToGo);
	Router.renderPageBasedOnPath(viewToRender);
	Header.highlightActiveNavLink();
	Router.listenForRouteChange();
	Router.handleBackAndForward();
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
        Auth2Fa.validationErrorClassName,
        formAndValidationErrorContainer,
        errorMessage
      );
      console.log(error);
    }
  }
}

export default Auth2Fa;
