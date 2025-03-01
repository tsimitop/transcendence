import Dom from "./Dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Pong from "../pages/Pong";
import Header from "../components/Header";

abstract class Router {
  static routes = {
    "/": Home,
    "/login": Login,
    "/pong": Pong,
  };

  static renderPageBasedOnPath() {
    const path = window.location.pathname;
    const toRender =
      Router.routes[path as keyof typeof Router.routes]?.create() ||
      NotFound.create();
    Dom.clearDOM();
    Dom.updateDOM(toRender);
    Header.highlightActiveNavLink();
    return toRender;
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
    const routeToGo = window.location.pathname;
    const toRender =
      Router.routes[routeToGo as keyof typeof Router.routes]?.create() ||
      NotFound.create();
    Dom.clearDOM();
    Dom.updateDOM(toRender);
    Router.listenForRouteChange();
  }

  static handleBackAndForward() {
    window.addEventListener("popstate", () => {
      Router.renderPageBasedOnPath();
    });
  }
}

export default Router;
