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
    const header = "<h1 class='text-center text-blue-900'>Homepage</h1>";
    const loginLink = document.createElement("a");
    loginLink.href = "/login";
    loginLink.innerText = "To Login";
    loginLink.classList.add("text-blue-500", "font-bold");
    const gameLink = document.createElement("a");
    gameLink.href = "/pong";
    gameLink.innerText = "To Pong";
    gameLink.classList.add("text-blue-500", "font-bold");
    const nav = document.createElement("nav");
    nav.append(loginLink, gameLink);
    nav.classList.add("flex", "gap-4");
    const HomeInstance = new Home(header, nav);
    HomeInstance.renderChildren("beforeend");
    return HomeInstance;
  }
}

export default Home;
