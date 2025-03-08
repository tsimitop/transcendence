import Router from "./models/Router";

const renderApp = function (): void {
  const viewToRender = Router.findViewToRender();
  Router.renderPageBasedOnPath(viewToRender);
  Router.listenForRouteChange();
  Router.handleBackAndForward();
};

document.addEventListener("DOMContentLoaded", renderApp);
