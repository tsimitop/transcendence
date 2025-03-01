import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Login extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create() {
    if (!customElements.getName(Login)) {
      customElements.define("login-component", Login);
    }
    const html = `
			<main class="main-container layout-padding ${
        themeState.state === "light"
          ? "theme-primary-light"
          : "theme-primary-dark"
      }">
				<h1>Login</h1>
			</main>
		`;
    const LoginInstance = new Login(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    LoginInstance.insertChildren();
    LoginInstance.classList.add("page");
    return LoginInstance;
  }
}

export default Login;
