import Header from "./components/Header";
import { userContext } from "./context/UserContext";
import Router from "./models/Router";

const renderApp = async function () {
  const routeToGo = Router.findRouteToGo();
  const viewToRender = await Router.findViewToRender(routeToGo);
  console.log("userContext:", userContext.state);
  Router.renderPageBasedOnPath(viewToRender);
  Header.highlightActiveNavLink();
  Router.listenForRouteChange();
  Router.handleBackAndForward();
};

document.addEventListener("DOMContentLoaded", renderApp);
