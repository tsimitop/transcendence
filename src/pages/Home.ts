import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
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
    const html = `
			<main class="${
        themeState.state === "light"
          ? "theme-primary-light"
          : "theme-primary-dark"
      } main-container layout-padding">
				<h1>Home</h1>
			</main>
		`;
    const HomeInstance = new Home(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    HomeInstance.insertChildren();
    HomeInstance.classList.add("page");
    return HomeInstance;
  }
}

export default Home;
