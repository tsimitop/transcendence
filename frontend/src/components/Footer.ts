import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Footer extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static create() {
    if (!customElements.getName(Footer)) {
      customElements.define("footer-component", Footer);
    }

    const html = `
			<footer class="flex flex-col justify-center items-center grow-1 ">
				<p>&copy; Team X - ${new Date().getFullYear()}</p>
				<p class="text-sm">Icons by <a class="underline" href="https://icons8.com/" target="_blank">Icons8</a></p>
			</footer>`;
    const FooterInstance = new Footer({ html, position: "beforeend" });
    FooterInstance.insertChildren();
    FooterInstance.classList.add(
      `theme-secondary-${themeState.state}-full`,
      "layout-padding",
      "h-18",
      "flex",
      "items-center"
    );
    return FooterInstance;
  }
}

export default Footer;
