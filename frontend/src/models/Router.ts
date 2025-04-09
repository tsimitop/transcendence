import Dom from "./Dom";
import Home from "../pages/Home";
import SignUp from "../pages/SignUp";
import NotFound from "../pages/NotFound";
import Pong from "../pages/Pong";
import Header from "../components/Header";
import Component, { ChildElementType, ChildrenStringType } from "./Component";
import UrlContext, { urlContext } from "../context/UrlContext";
import { ROUTER_CLASS_NAME, ValidUrlPathsType } from "../constants";
import SignIn from "../pages/SignIn";
import { userContext } from "../context/UserContext";

import { AuthCheckType } from "../context/UserContext";

type ComponentType = {
  new (
    _childrenString: ChildrenStringType,
    _childElements: ChildElementType
  ): Component;
  create: () => Component;
};

type RoutesType = Record<ValidUrlPathsType, ComponentType>;

abstract class Router {
  static routes: RoutesType = {
    "/": Home,
    "/sign-up": SignUp,
    "/sign-in": SignIn,
    "/pong": Pong,
  };
  static protectedRoutes: ValidUrlPathsType[] = ["/pong"];
  static guestUsersRoutes: ValidUrlPathsType[] = ["/sign-in", "/sign-up"];

  static isProtectedRoute(route: string) {
    const foundRoute = Router.protectedRoutes.find(
      protectedRoute => protectedRoute === route
    );
    return !!foundRoute;
  }

  static isGuestRoute(route: string) {
    const foundRoute = Router.guestUsersRoutes.find(
      guestRoute => guestRoute === route
    );
    return !!foundRoute;
  }

  static renderPageBasedOnPath(viewToRender: Component) {
    Dom.clearDOM();
    Dom.updateDOM(viewToRender);
    return viewToRender;
  }

  static findRouteToGo() {
    const routeToGo = window.location.pathname;
    return routeToGo;
  }

  static async requestUserAuthStatus() {
    let data = null;
    try {
      data = ((await userContext.isUserSignedIn()) as AuthCheckType) || null;
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async requestNewAccessToken(): Promise<string> {
    let newJwtAccessToken = { newJwtAccessToken: "" };
    try {
      const response = await fetch(
        "http://localhost:80/api/generate-new-access-token",
        {
          method: "POST",
          credentials: "include",
          // headers: {
          //   Authorization: `Bearer ${}`,
          // },
        }
      );
      newJwtAccessToken = await response.json();
      if (!newJwtAccessToken.newJwtAccessToken) {
        throw new Error(
          "New access token could not be created! Refresh token might be expired"
        );
      }
      userContext.setState({
        ...userContext.state,
        jwtAccessToken: newJwtAccessToken.newJwtAccessToken,
      });
      console.log(
        "$$$$$$$$$$$$$$$$$$$$$$$$",
        newJwtAccessToken.newJwtAccessToken
      );
      return newJwtAccessToken.newJwtAccessToken;
    } catch (error) {
      console.log(error);
      return "";
    }
  }

  static getViewForGuestUser(routeToGo: string) {
    const viewToRender = Router.isGuestRoute(routeToGo)
      ? Router.routes[routeToGo as keyof typeof Router.routes]?.create()
      : Router.isProtectedRoute(routeToGo)
      ? Router.routes["/sign-in"].create()
      : Router.routes[routeToGo as keyof typeof Router.routes]?.create() ||
        NotFound.create();
    return viewToRender;
  }

  static async findViewToRender(routeToGo: string) {
    let data = null;
    let viewToRender = null;

    data = await Router.requestUserAuthStatus();
    if (!data) {
      viewToRender = NotFound.create();
      return viewToRender;
    }

    if (data?.isNewAccessTokenNeeded) {
      const newJwtAccessToken = await Router.requestNewAccessToken();
      console.log("newJwtAccessToken", newJwtAccessToken);
      if (!newJwtAccessToken) {
        viewToRender = Router.getViewForGuestUser(routeToGo);
        return viewToRender;
      } else {
        data.isAccessTokenValid = true;
      }
    }

    if (!data || !data.isAccessTokenValid) {
      console.log("data:", data);
      viewToRender = Router.getViewForGuestUser(routeToGo);
      return viewToRender;
    }

    viewToRender =
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

  static async handleChangeRoute(event: MouseEvent) {
    event.preventDefault();
    Router.removeRouteChangeListeners();
    const target = event.target as HTMLAnchorElement;
    window.history.pushState({}, "", target.href);
    const routeToGo = Router.findRouteToGo();
    const viewToRender = await Router.findViewToRender(routeToGo);
    Router.renderPageBasedOnPath(viewToRender);
    Router.listenForRouteChange();
    Header.highlightActiveNavLink();
  }

  static async handleBackAndForward() {
    window.addEventListener("popstate", async () => {
      const routeToGo = Router.findRouteToGo();
      const viewToRender = await Router.findViewToRender(routeToGo);
      Router.renderPageBasedOnPath(viewToRender);
      const validUrlPath = UrlContext.getValidUrlPath();
      urlContext.setState({ ...urlContext.state, path: validUrlPath });
      Header.highlightActiveNavLink();
    });
  }
}

export default Router;
