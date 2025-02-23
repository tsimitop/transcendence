type Position = "afterbegin" | "afterend" | "beforebegin" | "beforeend";

class Component extends HTMLElement {
  private _childrenString: string;
  private _childrenElements: HTMLElement | null;

  constructor(
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ) {
    super();
    this._childrenString = childrenString;
    this._childrenElements = childrenElements;
  }

  protected renderChildren(position: Position) {
    if (this._childrenString) {
      this.insertAdjacentHTML(position, this._childrenString);
    }

    if (this._childrenElements) {
      this.insertAdjacentElement(position, this._childrenElements);
    }
  }

  static create(
    position: Position,
    componentName: string,
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ): Component {
    customElements.define(componentName, this);
    const HomeInstance = new this(childrenString, childrenElements);
    HomeInstance.renderChildren(position);
    return HomeInstance;
  }
}

export default Component;
