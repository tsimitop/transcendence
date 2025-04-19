import Dom from "./Dom";
import Home from "../pages/Home";
import SignUp from "../pages/SignUp";
import NotFound from "../pages/NotFound";
import Pong from "../pages/Pong";
import Header from "../components/Header";
import Profile from "../pages/Profile";
import SignIn from "../pages/SignIn";
import Component, { ChildElementType, ChildrenStringType } from "./Component";
import UrlContext, { urlContext } from "../context/UrlContext";
import {
  GUEST_USER_REDIRECTION_PATH,
  NGINX_SERVER,
  PAGES,
  ROUTER_CLASS_NAME,
  SIGNED_IN_USER_REDIRECTION_PATH,
  ValidUrlPathsType,
} from "../constants";
import { userContext } from "../context/UserContext";

import { ValidateAccessTokenResponseType } from "../context/UserContext";

type NewAccessTokenResponseType = {
  errorMessage: string;
  newJwtAccessToken: string;
  userId: string;
  email: string;
  username: string;
  isSignedIn: boolean;
};

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
    "/profile": Profile,
  };
  static protectedRoutes: ValidUrlPathsType[] = ["/pong", "/profile"];
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
    // let data: AuthCheckType | null = null;
    try {
      const data =
        ((await userContext.isUserSignedIn()) as ValidateAccessTokenResponseType) ||
        null;
      // console.log("data:", data);
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async requestNewAccessToken(): Promise<NewAccessTokenResponseType | null> {
    // let newJwtAccessToken = "";
    try {
      const response = await fetch(
        `${NGINX_SERVER}/api/generate-new-access-token`,
        {
          method: "POST",
          credentials: "include",
          // headers: {
          //   Authorization: `Bearer ${}`,
          // },
        }
      );
      const data = (await response.json()) as NewAccessTokenResponseType;
      // console.log("data after new access token generation:", data);
      const {
        newJwtAccessToken,
        userId,
        email,
        username,
        isSignedIn,
        errorMessage,
      } = data;
      if (!newJwtAccessToken) {
        // throw new Error(
        //   "New access token could not be created! Refresh token might be expired"
        // );
        console.log(errorMessage, "------------");
        throw errorMessage;
      }
      userContext.setState({
        ...userContext.state,
        id: userId,
        email,
        username,
        isSignedIn,
        jwtAccessToken: newJwtAccessToken,
      });
      // console.log("$$$$$$$$$$$$$$$$$$$$$$$$", newJwtAccessToken);
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getViewForGuestUser(routeToGo: string) {
    const viewToRender = Router.isGuestRoute(routeToGo)
      ? Router.routes[routeToGo as keyof typeof Router.routes]?.create()
      : Router.isProtectedRoute(routeToGo)
      ? Router.routes[GUEST_USER_REDIRECTION_PATH].create()
      : Router.routes[routeToGo as keyof typeof Router.routes]?.create() ||
        NotFound.create();

    if (Router.isProtectedRoute(routeToGo)) {
      urlContext.setState({
        ...urlContext.state,
        path: GUEST_USER_REDIRECTION_PATH,
      });
    }
    return viewToRender;
  }

  static getViewForSignedInUser(routeToGo: string) {
    const guestRoute = Router.guestUsersRoutes.find(
      route => route === routeToGo
    );
    const viewToRender =
      routeToGo === guestRoute
        ? Router.routes[SIGNED_IN_USER_REDIRECTION_PATH].create()
        : routeToGo in Router.routes
        ? Router.routes[routeToGo as keyof typeof Router.routes]?.create()
        : NotFound.create();

    if (guestRoute) {
      urlContext.setState({
        ...urlContext.state,
        path: SIGNED_IN_USER_REDIRECTION_PATH,
      });
    }
    return viewToRender;
  }

  static async findViewToRender(routeToGo: string) {
    let data:
      | ValidateAccessTokenResponseType
      | (NewAccessTokenResponseType & { isAccessTokenValid?: boolean })
      | null = null;
    let viewToRender = null;

    data = await Router.requestUserAuthStatus();
    if (!data) {
      userContext.setState({
        ...userContext.state,
        id: "",
        email: "",
        username: "",
        isSignedIn: false,
      });
      viewToRender = NotFound.create();
      return viewToRender;
    }

    if (data?.isNewAccessTokenNeeded) {
      console.log("getting new access token . . .");
      data = await Router.requestNewAccessToken();
      // console.log("newJwtAccessToken", newJwtAccessToken);
      if (!data || !data.newJwtAccessToken) {
        userContext.setState({
          ...userContext.state,
          id: "",
          email: "",
          username: "",
          isSignedIn: false,
        });
        viewToRender = Router.getViewForGuestUser(routeToGo);
        return viewToRender;
      } else {
        data.isAccessTokenValid = true;
      }
    }

    if (!data || !data.isAccessTokenValid) {
      // console.log("data:", data);
      userContext.setState({
        ...userContext.state,
        id: "",
        email: "",
        username: "",
        isSignedIn: false,
      });
      viewToRender = Router.getViewForGuestUser(routeToGo);
      return viewToRender;
    }

    const { userId, email, username, isSignedIn } = data;
    userContext.setState({
      ...userContext.state,
      id: userId,
      email,
      username,
      isSignedIn,
    });
    viewToRender = Router.getViewForSignedInUser(routeToGo);
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
    const validPath = PAGES.find(page => page === target.pathname);
    urlContext.setState({ ...urlContext.state, path: validPath });
    // console.log(urlContext.state);
    const routeToGo = Router.findRouteToGo();
    const viewToRender = await Router.findViewToRender(routeToGo);
    Router.renderPageBasedOnPath(viewToRender);
    Router.listenForRouteChange();
    // console.log(urlContext.state);
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

  static async redirect(pathToRedirect: ValidUrlPathsType) {
    urlContext.setState({ ...urlContext.state, path: pathToRedirect });
    // console.log("path to redirect:", pathToRedirect);
    const routeToGo = Router.findRouteToGo();
    const viewToRender = await Router.findViewToRender(routeToGo);
    Router.renderPageBasedOnPath(viewToRender);
    Router.removeRouteChangeListeners();
    Router.listenForRouteChange();
    Header.highlightActiveNavLink();
  }
}

export default Router;
