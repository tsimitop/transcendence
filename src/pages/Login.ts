import Component from "../models/Component";

class Login extends Component {
  constructor(
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ) {
    super(childrenString, childrenElements);
  }

  static create() {
    customElements.define("login-component", Login);
    const header = "<h1>Login</h1>";
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<a href='/home'>To Home</a>";
    const LoginInstance = new Login(header, paragraph);
    LoginInstance.renderChildren("beforeend");
    return LoginInstance;
  }
}

export default Login;
