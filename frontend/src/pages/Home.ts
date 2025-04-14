import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Home extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create(): Home {
    if (!customElements.getName(Home)) {
      customElements.define("home-component", Home);
    }
    const html = `
			<main class="
				theme-primary-${themeState.state}-full main-container layout-padding"
			>
				<h1>Welcome ${userContext.state.username || userContext.state.email}</h1>
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
