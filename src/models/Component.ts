type Position = "afterbegin" | "afterend" | "beforebegin" | "beforeend";

abstract class Component extends HTMLElement {
  private _childrenString: string;
  private _childrenElements: HTMLElement[];

  constructor(childrenString: string = "", ...childrenElements: HTMLElement[]) {
    super();
    this._childrenString = childrenString;
    this._childrenElements = childrenElements;
  }

  protected renderChildren(position: Position): void {
    if (this._childrenString) {
      this.insertAdjacentHTML(position, this._childrenString);
    }

    if (this._childrenElements.length) {
      this._childrenElements.forEach(childElement => {
        this.insertAdjacentElement(position, childElement);
      });
    }
  }
}

export default Component;
