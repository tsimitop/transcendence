type Position = "afterbegin" | "afterend" | "beforebegin" | "beforeend";

abstract class Component extends HTMLElement {
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

  protected renderChildren(position: Position): void {
    if (this._childrenString) {
      this.insertAdjacentHTML(position, this._childrenString);
    }

    if (this._childrenElements) {
      this.insertAdjacentElement(position, this._childrenElements);
    }
  }
}

export default Component;
