import { Home } from "./pages/Home";

const renderApp = function (): void {
  const root = document.getElementById("root")!;
  const HomeInstance = Home.create();

  root.append(HomeInstance);
};

renderApp();
