import Dom from "./Dom";
import Home from "../pages/Home";
import SignUp from "../pages/Signup";
import NotFound from "../pages/NotFound";
import Pong from "../pages/Pong";
import Header from "../components/Header";
import Component from "./Component";
import UrlContext, { urlContext } from "../context/UrlContext";
import { ROUTER_CLASS_NAME, ValidUrlPathsType } from "../constants";
import SignIn from "../pages/SignIn";

type RoutesType = Record<ValidUrlPathsType, any>;

abstract class Router {
  static routes: RoutesType = {
    "/": Home,
    "/sign-up": SignUp,
    "/sign-in": SignIn,
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
      `.${ROUTER_CLASS_NAME}`
    ) as NodeListOf<HTMLAnchorElement>;
    for (const link of allLinks) {
      link.addEventListener("click", Router.handleChangeRoute);
    }
  }

  static removeRouteChangeListeners() {
    const allLinks = document.querySelectorAll(
      `.${ROUTER_CLASS_NAME}`
    ) as NodeListOf<HTMLAnchorElement>;
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
      const validUrlPath = UrlContext.getValidUrlPath();
      urlContext.setState({ ...urlContext.state, path: validUrlPath });
      Header.highlightActiveNavLink();
    });
  }
}

export default Router;
