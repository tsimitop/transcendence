type Position = "afterbegin" | "afterend" | "beforebegin" | "beforeend";

abstract class Component extends HTMLElement {
  private _childrenString: string;
  private _childrenElements: HTMLElement[];

  constructor(childrenString: string = "", ...childrenElements: HTMLElement[]) {
    super();
    this._childrenString = childrenString;
    this._childrenElements = childrenElements;
  }

  protected insertChildren(
    childrenStringPosition: Position,
    childrenElementsPosition: Position
  ): void {
    if (this._childrenString) {
      this.insertAdjacentHTML(childrenStringPosition, this._childrenString);
    }

    if (this._childrenElements.length) {
      this._childrenElements.forEach(childElement => {
        this.insertAdjacentElement(childrenElementsPosition, childElement);
      });
    }
  }
}

export default Component;
