import Router from "./models/Router";

const renderApp = function (): void {
  Router.renderPageBasedOnPath();
  Router.listenForRouteChange();
  Router.handleBackAndForward();
};

document.addEventListener("DOMContentLoaded", renderApp);
