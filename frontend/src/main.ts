import Header from "./components/Header";
import Router from "./models/Router";

const renderApp = function (): void {
  const viewToRender = Router.findViewToRender();
  Router.renderPageBasedOnPath(viewToRender);
  Header.highlightActiveNavLink();
  Router.listenForRouteChange();
  Router.handleBackAndForward();
};

document.addEventListener("DOMContentLoaded", renderApp);
