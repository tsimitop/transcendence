import { Home } from "./pages/Home";

function renderApp() {
  const root = document.getElementById("root")!;
  const paragraph = document.createElement("p");
  paragraph.innerText = "paragraph";
  const HomeInstance = Home.create(
    "beforeend",
    "home-component",
    "<h1>Home</h1>",
    paragraph
  );

  root.append(HomeInstance);
}

renderApp();
