import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

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

    main.addEventListener("click", SignIn.handleClick);

    const html = `
				<h1>Sign In</h1>
				<form>
					<label for="username">Username</label>
					<input type="text" username="username" id="username" placeholder="username" class="border-2" />
					<label for="password">Password</label>
					<input type="password" name="password" id="password" placeholder="password" class="border-2" />
					<button type="submit" class="signin-submit-btn cursor-pointer border-2">Sign in</button>
					<p>
						<span>Don't have an account?</span>
						<a class=${ROUTER_CLASS_NAME} href="/signup">Sign up</a>
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

  public static handleClick(event: MouseEvent) {
    event.preventDefault();
    console.log(event);
  }
}

export default SignIn;
