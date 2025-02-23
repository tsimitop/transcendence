import Component from "../models/Component";

class Home extends Component {
  constructor(
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ) {
    super(childrenString, childrenElements);
  }

  static create(): Home {
    if (!customElements.getName(Home)) {
      customElements.define("home-component", Home);
    }
    const header = "<h1>Homepage</h1>";
    const loginLink = document.createElement("a");
    loginLink.href = "/login";
    loginLink.innerText = "To Login";
    const HomeInstance = new Home(header, loginLink);
    HomeInstance.renderChildren("beforeend");
    return HomeInstance;
  }
}

export default Home;
