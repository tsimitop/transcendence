import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Profile extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static create() {
    if (!customElements.getName(Profile)) {
      customElements.define("signout-component", Profile);
    }

    const html = `<main class="${
      themeState.state === "light"
        ? "theme-primary-light-full"
        : "theme-primary-dark-full"
    } main-container layout-padding">
				<h1>Profile</h1>
			</main>`;

    const SignOutInstance = new Profile(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignOutInstance.insertChildren();
    SignOutInstance.classList.add("page");
    return SignOutInstance;
  }
}

export default Profile;
