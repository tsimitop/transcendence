export const ROUTER_CLASS_NAME = "router-link";

export type ValidUrlPathsType =
  | "/"
  | "/sign-up"
  | "/pong"
  | "/sign-in"
  | "/profile"
  | "/edit"
  | "/users"
  | "/dashboard"
  | "/2fa"
  | "/friends";

export const PAGES: ValidUrlPathsType[] = [
  "/",
  "/sign-up",
  "/pong",
  "/sign-in",
  "/profile",
  "/edit",
  "/users",
  "/dashboard",
  "/2fa",
  "/friends",
];

export const NO_HIGHLIGHT_LINKS: ValidUrlPathsType[] = [];

export const SIGNED_IN_USER_REDIRECTION_PATH: ValidUrlPathsType = "/";
export const GUEST_USER_REDIRECTION_PATH: ValidUrlPathsType = "/sign-in";

// this affects the other stuff, change the port in the docker compose file too if you change this
// otherwise cors will not work
export const CADDY_SERVER = `https://${window.location.hostname}:4443`;