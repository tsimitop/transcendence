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
    const header = "<h1>Login</h1>";
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<a href='/'>To Home</a>";
    const LoginInstance = new Login(
      { html: header, position: "beforeend" },
      { element: paragraph, position: "beforeend" }
    );
    LoginInstance.insertChildren();
    return LoginInstance;
  }
}

export default Login;
