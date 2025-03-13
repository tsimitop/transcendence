import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
import { userContext } from "../context/UserContext";
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
      "main-container",
      "layout-padding",
      `${
        themeState.state === "light"
          ? "theme-primary-light-full"
          : "theme-primary-dark-full"
      }`
    );

    main.addEventListener("click", SignUp.handleClick);

    const html = `
				<h1>Sign Up</h1>
				<form>
					<label for="email">Email</label>
					<input type="email" name="email" id="email" placeholder="email" class="email-signup-input border-2" />
					<label for="username">Username</label>
					<input type="text" username="username" id="username" placeholder="username" class="username-signup-input border-2" />
					<label for="password">Password</label>
					<input type="password" name="password" id="password" placeholder="password" class="password-signup-input border-2" />
					<button type="submit" class="signup-btn cursor-pointer border-2">Sign up</button>
					<p>
						<span>Already have an account?</span>
						<a class=${ROUTER_CLASS_NAME} href="/sign-in">Sign in</a>
					</p>
				</form>
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

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLButtonElement;
    if (target.className.includes("signup-btn")) {
      event.preventDefault();
      SignUp.handleSubmit();
    }
  }

  public static handleSubmit() {
    const email = (
      document.querySelector(".email-signup-input") as HTMLInputElement
    ).value;
    const username = (
      document.querySelector(".username-signup-input") as HTMLInputElement
    ).value;
    const password = (
      document.querySelector(".password-signup-input") as HTMLInputElement
    ).value;

    if (!email.trim() || !username.trim() || !password.trim()) {
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
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        userContext.setState({
          ...userContext.state,
          email: data.email,
          username: data.username,
          isSignedIn: true,
        });
      });
  }
}

export default SignUp;
