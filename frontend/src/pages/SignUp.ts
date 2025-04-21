import Footer from "../components/Footer";
import Header from "../components/Header";
import { NGINX_SERVER, ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
// import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { displayFormValidationError } from "../utils/display-form-validation-error";
import SignIn from "./SignIn";

class SignUp extends Component {
  static validationErrorClassName = "sign-up-validation-error";
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create() {
    if (!customElements.getName(SignUp)) {
      customElements.define("signup-component", SignUp);
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

    main.addEventListener("submit", SignUp.handleSignUp);
    main.addEventListener("click", SignUp.handleClick);

    const html = `
			<div class="flex flex-col gap-8">
				<form class="sign-up-form flex flex-col gap-6">
					<div class="grid grid-cols-[100px_400px] items-center">
						<label for="email">Email</label>
						<input required type="email" name="email" id="email" placeholder="email" class="theme-input-${themeState.state} email-signup-input px-2 py-1" />
					</div>
					<div class="grid grid-cols-[100px_400px] items-center">
						<label for="username">Username</label>
						<input required maxlength="20" type="text" username="username" id="username" placeholder="username" class="theme-input-${themeState.state} username-signup-input px-2 py-1" />
					</div>
					<div class="grid grid-cols-[100px_400px] items-center">
						<label for="password">Password</label>
						<input required type="password" name="password" id="password" placeholder="password" class="theme-input-${themeState.state} password-signup-input px-2 py-1" />
					</div>
					<div class="flex items-end mt-3">
						<p>
							<span class="text-sm">Already have an account?</span>
							<a class="${ROUTER_CLASS_NAME} text-xs underline hover:no-underline" href="/sign-in">Sign in &rarr;</a>
						</p>
						<button type="submit" class="theme-btn-${themeState.state} signup-btn cursor-pointer block ml-auto mr-0 px-6 py-2">Sign up</button>
					</div>
				</form>
			</div>
		`;

    formAndValidationErrorContainer.insertAdjacentHTML("beforeend", html);

    const SignUpInstance = new SignUp(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignUpInstance.insertChildren();
    SignUpInstance.classList.add("page");
    return SignUpInstance;
  }

  public static async handleSignUp(event: SubmitEvent) {
    const target = event.target as HTMLFormElement;
    event.preventDefault();
    if (!target.className.includes("sign-up-form")) {
      return;
    }

    const email = (
      document.querySelector(".email-signup-input") as HTMLInputElement
    ).value.trim();
    const username = (
      document.querySelector(".username-signup-input") as HTMLInputElement
    ).value.trim();
    const password = (
      document.querySelector(".password-signup-input") as HTMLInputElement
    ).value;

    if (!email || !username || !password.trim()) {
      const formAndValidationErrorContainer = document.querySelector(
        ".form-and-validation-container"
      ) as HTMLElement;

      const errorMessage = "Inputs cannot be only whitespace";

      displayFormValidationError(
        SignUp.validationErrorClassName,
        formAndValidationErrorContainer,
        errorMessage
      );
      return;
    }

    try {
      const response = await fetch(`${NGINX_SERVER}/api/sign-up`, {
        // fetch("http://172.18.0.2:80/api", {
        // fetch("http://nginx:80/api", {
        // fetch("http://nginx.ft_transcendence_default:80/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      if (data.errorMessage || data.error) {
        throw data;
      }
      // userContext.setState({
      //   ...userContext.state,
      //   email: data.email,
      //   username: data.username,
      //   isSignedIn: true,
      // });
      console.log(
        `The user with the email "${data.email?.toLowerCase()}" and the username "${data.username?.toLowerCase()}" is added to the database.`
      );

      await SignIn.postSignInData(email, password);
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
        SignUp.validationErrorClassName,
        formAndValidationErrorContainer,
        errorMessage
      );
      console.log("sign up error:\n", error);
    }
  }
}

export default SignUp;
