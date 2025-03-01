import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Pong extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create() {
    if (!customElements.getName(Pong)) {
      customElements.define("pong-component", Pong);
    }

    const html = `
			<main class="main-container layout-padding ${
        themeState.state === "light"
          ? "theme-primary-light"
          : "theme-primary-dark"
      }">
				<h1>Pong</h1>
			</main>
		`;
    const PongInstance = new Pong(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    PongInstance.insertChildren();
    PongInstance.classList.add("page");
    return PongInstance;
  }
}

export default Pong;
