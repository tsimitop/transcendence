import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class NotFound extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElement: ChildElementType[]
  ) {
    super(childrenString, ...childElement);
  }
  static create() {
    if (!customElements.getName(NotFound)) {
      customElements.define("not-found", NotFound);
    }

    const html = `
			<main class="${
        themeState.state === "light"
          ? "theme-primary-light-full"
          : "theme-primary-dark-full"
      } main-container layout-padding">
				<h1>Not Found! 404</h1>
			</main>
		`;

    const NotFoundInstance = new NotFound(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    NotFoundInstance.insertChildren();
    NotFoundInstance.classList.add("page");
    return NotFoundInstance;
  }
}

export default NotFound;
