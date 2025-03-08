type Position = "afterbegin" | "afterend" | "beforebegin" | "beforeend";

export type ChildElementType = {
  element: HTMLElement;
  position: Position;
};

export type ChildrenStringType = {
  html: string;
  position: Position;
};

abstract class Component extends HTMLElement {
  private _childrenString: ChildrenStringType;
  private _childElements: ChildElementType[];

  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super();
    this._childrenString = childrenString;
    this._childElements = childElements;
  }

  protected insertChildren(): void {
    if (this._childrenString) {
      this.insertAdjacentHTML(
        this._childrenString.position,
        this._childrenString.html
      );
    }

    if (this._childElements.length) {
      this._childElements.forEach(childElement => {
        this.insertAdjacentElement(childElement.position, childElement.element);
      });
    }
  }
}

export default Component;
