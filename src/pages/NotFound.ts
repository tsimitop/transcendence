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
    const header = "<h1>Not Found</h1>";
    const NotFoundInstance = new NotFound({
      html: header,
      position: "beforeend",
    });
    NotFoundInstance.insertChildren();
    return NotFoundInstance;
  }
}

export default NotFound;
