import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import { userContext } from "../context/UserContext";
import Component from "../models/Component";

class Auth2Fa extends Component {
  public static create() {
    if (!customElements.getName(Auth2Fa)) {
      customElements.define("auth2fa-component", Auth2Fa);
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

    main.addEventListener("click", Auth2Fa.handleClick);

    const html = `
			<h1>Welcome ${userContext.state.username}</h1>
			<div class="flex flex-col gap-8">
				<form class="sign-in-form flex flex-col gap-3">
					<div class="grid grid-cols-[150px_1fr] items-center">
						<label for="2fa-code">6-digit code</label>
						<input required type="number" min="6" max="6" name="2fa-code" id="2fa-code" placeholder="6-digit code" class="theme-input-${themeState.state} 2fa-code-input w-80 px-2 py-1" />
					</div>
					<button type="submit" class="theme-btn-${themeState.state} 2fa-code-btn cursor-pointer block ml-auto mr-0 px-6 py-2">Submit</button>
					<button type="submit" class="theme-btn-${themeState.state} 2fa-cancel-btn cursor-pointer block ml-auto mr-0 px-6 py-2">Cancel</button>
				</form>
			</div>
			`;

    main.insertAdjacentHTML("beforeend", html);

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
}

export default Auth2Fa;
