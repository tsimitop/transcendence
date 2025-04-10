import { PAGES } from "../constants";
import { urlContext } from "../context/UrlContext";

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

  protected static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === "A") {
      const link = target as HTMLAnchorElement;
      const validPath = PAGES.find(page => page === link.pathname);
      if (validPath) {
        urlContext.setState({ ...urlContext.state, path: validPath });
      }
    }
  }
}

export default Component;
