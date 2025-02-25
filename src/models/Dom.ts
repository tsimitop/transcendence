abstract class Dom {
  private static _root: HTMLElement = document.getElementById("root")!;

  public static get root() {
    return this._root;
  }

  public static clearDOM = function (): void {
    Dom._root.innerHTML = "";
  };

  public static updateDOM = function (component: HTMLElement): void {
    Dom._root.append(component);
  };
}

export default Dom;
