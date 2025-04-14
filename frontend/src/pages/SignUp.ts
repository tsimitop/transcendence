import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
// import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class SignUp extends Component {
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
				<form class="sign-up-form flex flex-col gap-3">
					<div class="grid grid-cols-[150px_1fr] items-center">
						<label for="email">Email</label>
						<input required type="email" name="email" id="email" placeholder="email" class="${
              themeState.state === "light"
                ? "theme-input-light"
                : "theme-input-dark"
            } email-signup-input w-80 px-2 py-1" />
					</div>
					<div class="grid grid-cols-[150px_1fr] items-center">
						<label for="username">Username</label>
						<input required minlength="4" maxlength="20" type="text" username="username" id="username" placeholder="username" class="${
              themeState.state === "light"
                ? "theme-input-light"
                : "theme-input-dark"
            } username-signup-input w-80 px-2 py-1" />
					</div>
					<div class="grid grid-cols-[150px_1fr] items-center">
						<label for="password">Password</label>
						<input required type="password" name="password" id="password" placeholder="password" class="${
              themeState.state === "light"
                ? "theme-input-light"
                : "theme-input-dark"
            } password-signup-input w-80 px-2 py-1" />
					</div>
						<button type="submit" class="${
              themeState.state === "light"
                ? "theme-btn-light"
                : "theme-btn-dark"
            } signup-btn cursor-pointer block ml-auto mr-0 px-6 py-2 ">Sign up</button>
						<p>
							<span class="text-sm">Already have an account?</span>
							<a class="${ROUTER_CLASS_NAME} text-xs underline hover:no-underline" href="/sign-in">Sign in &rarr;</a>
						</p>
				</form>
			</div>
		`;

    main.insertAdjacentHTML("beforeend", html);

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

  public static handleSignUp(event: SubmitEvent) {
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
      console.log("required field*");
      return;
    }

    fetch("http://localhost:80/api/sign-up", {
      // fetch("http://172.18.0.2:80/api", {
      // fetch("http://nginx:80/api", {
      // fetch("http://nginx.ft_transcendence_default:80/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, username, password }),
      signal: AbortSignal.timeout(5000),
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
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
      })
      .catch(error => {
        console.log("sign up error:\n", error);
      });
  }
}

export default SignUp;
