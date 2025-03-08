import Dom from "./Dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Pong from "../pages/Pong";
import Header from "../components/Header";
import Component from "./Component";
import { urlState } from "../context/UrlContext";

abstract class Router {
  static routes = {
    "/": Home,
    "/login": Login,
    "/pong": Pong,
  };

  static renderPageBasedOnPath(viewToRender: Component) {
    Dom.clearDOM();
    Dom.updateDOM(viewToRender);
    return viewToRender;
  }

  static findViewToRender() {
    const routeToGo = window.location.pathname;
    const viewToRender =
      Router.routes[routeToGo as keyof typeof Router.routes]?.create() ||
      NotFound.create();
    return viewToRender;
  }

  static listenForRouteChange() {
    const allLinks = document.querySelectorAll(
      "a.nav-link"
    ) as NodeListOf<HTMLAnchorElement>;
    for (const link of allLinks) {
      link.addEventListener("click", Router.handleChangeRoute);
    }
  }

  static removeRouteChangeListeners() {
    const allLinks = document.querySelectorAll("a");
    for (const link of allLinks) {
      link.removeEventListener("click", Router.handleChangeRoute);
    }
  }

  static handleChangeRoute(event: MouseEvent) {
    event.preventDefault();
    Router.removeRouteChangeListeners();
    const target = event.target as HTMLAnchorElement;
    window.history.pushState({}, "", target.href);
    const viewToRender = Router.findViewToRender();
    Router.renderPageBasedOnPath(viewToRender);
    Router.listenForRouteChange();
  }

  static handleBackAndForward() {
    window.addEventListener("popstate", () => {
      const viewToRender = Router.findViewToRender();
      Router.renderPageBasedOnPath(viewToRender);
      urlState.setState({ path: window.location.pathname });
      console.log(urlState.state);
      Header.highlightActiveNavLink();
    });
  }
}

export default Router;
