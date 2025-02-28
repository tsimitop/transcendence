import Header from "../components/Header";
import Component from "../models/Component";

class Home extends Component {
  constructor(childrenString: string = "", ...childrenElements: HTMLElement[]) {
    super(childrenString, ...childrenElements);
  }

  static create(): Home {
    if (!customElements.getName(Home)) {
      customElements.define("home-component", Home);
    }
    const h1 = "<h1 class='theme-ternary-light text-center'>Homepage</h1>";

    const HomeInstance = new Home(h1, Header.create());
    HomeInstance.insertChildren("beforeend", "afterbegin");

    return HomeInstance;
  }
}

export default Home;
