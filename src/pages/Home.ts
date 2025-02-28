import Footer from "../components/Footer";
import Header from "../components/Header";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Home extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childrenElements: ChildElementType[]
  ) {
    super(childrenString, ...childrenElements);
  }

  static create(): Home {
    if (!customElements.getName(Home)) {
      customElements.define("home-component", Home);
    }
    const h1 = "<h1 class='theme-ternary-light text-center'>Homepage</h1>";

    const HomeInstance = new Home(
      { html: h1, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    HomeInstance.insertChildren();

    return HomeInstance;
  }
}

export default Home;
