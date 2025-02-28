import Component from "../models/Component";

class NotFound extends Component {
  constructor(childrenString: string = "", ...childrenElement: HTMLElement[]) {
    super(childrenString, ...childrenElement);
  }
  static create() {
    if (!customElements.getName(NotFound)) {
      customElements.define("not-found", NotFound);
    }
    const header = "<h1>Not Found</h1>";
    const NotFoundInstance = new NotFound(header);
    NotFoundInstance.renderChildren("beforeend");
    return NotFoundInstance;
  }
}

export default NotFound;
