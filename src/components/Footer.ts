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

    const html = `<footer>Footer</footer>`;
    const FooterInstance = new Footer({ html, position: "beforeend" });
    FooterInstance.insertChildren();
    FooterInstance.classList.add("h-12", "theme-secondary-light", "block");
    return FooterInstance;
  }
}

export default Footer;
