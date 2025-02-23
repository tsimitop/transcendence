import Component from "./models/Component";

export const root = document.getElementById("root")!;

export const clearDOM = function (): void {
  root.innerHTML = "";
};

export const updateDOM = function (component: Component): void {
  root.append(component);
};
