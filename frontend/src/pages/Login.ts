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

    main.addEventListener("click", Login.handleClick);

    const html = `
				<h1>Login</h1>
				<form>
					<label for="name">Name</label>
					<input type="text" name="name" id="name" placeholder="name" class="border-2" />
					<button type="submit" class="login-submit-btn cursor-pointer border-2">Submit</button>
				</form>
		`;

    main.insertAdjacentHTML("beforeend", html);

    const LoginInstance = new Login(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    LoginInstance.insertChildren();
    LoginInstance.classList.add("page");

    return LoginInstance;
  }

  public static handleClick(event: MouseEvent) {
    event.preventDefault();
    const target = event.target as HTMLButtonElement;
    if (target.className.includes("login-submit-btn")) {
      Login.handleSubmit();
    }
  }

  public static handleSubmit() {
    fetch("http://localhost:80/api", {
      // fetch("http://172.18.0.2:80/api", {
      // fetch("http://nginx:80/api", {
      // fetch("http://nginx.ft_transcendence_default:80/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "test" }),
    })
      .then(response => {
        console.log(response);
        return response.json();
      })
      .then(data => console.log(data));
  }
}

export default Login;
