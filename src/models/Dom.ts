abstract class Dom {
  private static _root: HTMLElement = document.getElementById("root")!;

  static clearDOM = function (): void {
    Dom._root.innerHTML = "";
  };

  static updateDOM = function (component: HTMLElement): void {
    Dom._root.append(component);
  };
}

export default Dom;
