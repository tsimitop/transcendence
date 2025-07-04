import Dom from "./Dom";
import Home from "../pages/Home";
import SignUp from "../pages/SignUp";
import NotFound from "../pages/NotFound";
import Pong from "../pages/Pong";
import Header from "../components/Header";
import Profile from "../pages/Profile";
import Edit from "../pages/Edit";
import Users from "../pages/Users";
import SignIn from "../pages/SignIn";
import Auth2Fa from "../pages/Auth2Fa";
import Dashboard from "../pages/Dashboard";
import Component, { ChildElementType, ChildrenStringType } from "./Component";
import UrlContext, { urlContext } from "../context/UrlContext";
import {
  GUEST_USER_REDIRECTION_PATH,
  CADDY_SERVER,
  PAGES,
  ROUTER_CLASS_NAME,
  SIGNED_IN_USER_REDIRECTION_PATH,
  ValidUrlPathsType,
} from "../constants";
import { userContext, UserStateType } from "../context/UserContext";

import { ValidateAccessTokenResponseType } from "../context/UserContext";

type NewAccessTokenResponseType = {
  errorMessage: string;
  userId: string;
  email: string;
  username: string;
  isSignedIn: boolean;
  avatar: string;
  has2Fa?: boolean;
};

type ComponentType = {
  new (
    _childrenString: ChildrenStringType,
    _childElements: ChildElementType
  ): Component;
  create: () => Component | Promise<Component>;
};

type RoutesType = Record<ValidUrlPathsType, ComponentType>;

abstract class Router {
  static routes: RoutesType = {
    "/": Home,
    "/sign-up": SignUp,
    "/sign-in": SignIn,
    "/pong": Pong,
    "/profile": Profile,
    "/edit": Edit,
    "/users": Users,
    "/friends": Users,
    "/2fa": Auth2Fa,
	"/dashboard": Dashboard,
  };
  static protectedRoutes: ValidUrlPathsType[] = ["/pong", "/profile", "/users", "/edit"];
  static guestUsersRoutes: ValidUrlPathsType[] = [
    "/sign-in",
    "/sign-up",
    "/2fa",
  ];

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
      const data = ((await userContext.isUserSignedIn()) as ValidateAccessTokenResponseType) || null;

   if (data && data.isAccessTokenValid) {
	     userContext.setState({
	       ...userContext.state,
	       id: data.userId,
	       email: data.email,
	       username: data.username,
	       isSignedIn: true,
         avatar: data.avatar,
	     });
	   }

      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async requestNewAccessToken(): Promise<NewAccessTokenResponseType | null> {
    try {
      const response = await fetch(
        `${CADDY_SERVER}/api/generate-new-access-token`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = (await response.json()) as NewAccessTokenResponseType;
      const {
        userId,
        email,
        username,
        isSignedIn,
        errorMessage,
		avatar,
      } = data;
      if (errorMessage) {
        throw errorMessage;
      }
      userContext.setState({
        ...userContext.state,
        id: userId,
        email,
        username,
        isSignedIn,
		avatar,
      });

      const has2Fa = await Router.is2FaActive(userContext.state);
      if (has2Fa) {
        return { ...data, has2Fa };
      } else {
        return data;
      }
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
    let data: ValidateAccessTokenResponseType | null = null;
    let viewToRender = null;

    data = await Router.requestUserAuthStatus();
    if (!data) {
      userContext.setState({
        ...userContext.state,
        id: "",
        email: "",
        username: "",
        isSignedIn: false,
        avatar: "",
      });
      viewToRender = NotFound.create();
      return viewToRender;
    }

    if (data?.isNewAccessTokenNeeded) {
      console.log("getting new access token . . .");
      const newTokenData = await Router.requestNewAccessToken();
      if (!newTokenData || newTokenData.errorMessage) {
        userContext.setState({
          ...userContext.state,
          id: "",
          email: "",
          username: "",
          isSignedIn: false,
          avatar: "",
        });
        viewToRender = Router.getViewForGuestUser(routeToGo);
        return viewToRender;
      } else {
        data.isAccessTokenValid = true;
      }
    }

    if (!data || !data.isAccessTokenValid) {
      const userInBackendSession =
        (await Router.isUserDataInBackendSession()) as UserStateType;
      if (!userInBackendSession) {
        userContext.setState({
          ...userContext.state,
          id: "",
          email: "",
          username: "",
          isSignedIn: false,
          avatar: "",
        });
      } else {
        userContext.setState({
          ...userContext.state,
          id: userInBackendSession.id,
          email: userInBackendSession.email,
          username: userInBackendSession.username,
          isSignedIn: userInBackendSession.isSignedIn,
          avatar: userInBackendSession.avatar,
        });
      }
      viewToRender = Router.getViewForGuestUser(routeToGo);
      return viewToRender;
    }

    const { userId, email, username, isSignedIn, avatar } = data;

    userContext.setState({
      ...userContext.state,
      id: userId,
      email,
      username,
      isSignedIn,
	  avatar,
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
    const routeToGo = Router.findRouteToGo();
    const viewToRender = await Router.findViewToRender(routeToGo);
    Router.renderPageBasedOnPath(viewToRender);
    Router.removeRouteChangeListeners();
    Router.listenForRouteChange();
    Header.highlightActiveNavLink();
  }

// Navigates to a route with query, updates state, renders view, and highlights active nav link.
  static async navigateWithQuery(route: ValidUrlPathsType, query: string) {
	window.history.pushState({}, "", `${route}?${query}`);
	urlContext.setState({ path: route });
	const view = await Router.findViewToRender(route);
	Router.renderPageBasedOnPath(view);
	Router.listenForRouteChange();
	Header.highlightActiveNavLink();
  }

  static async is2FaActive(user: UserStateType) {
    try {
      const response = await fetch(`${CADDY_SERVER}/api/has-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      const data = (await response.json()) as { has2Fa: boolean };
      return data.has2Fa;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async isUserDataInBackendSession() {
    try {
      const response = await fetch(
        `${CADDY_SERVER}/api/get-user-session-data`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (!data) {
        throw Error("No user session found");
      }
      return data;
    } catch (error) {
      void error;
      // console.log(error);
      return null;
    }
  }
}

export default Router;
