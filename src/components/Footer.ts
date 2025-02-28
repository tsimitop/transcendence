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
    return FooterInstance;
  }
}

export default Footer;
