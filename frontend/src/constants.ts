export const ROUTER_CLASS_NAME = "router-link";

export type ValidUrlPathsType =
  | "/"
  | "/sign-up"
  | "/pong"
  | "/sign-in"
  | "/profile"
  | "/2fa";

export const PAGES: ValidUrlPathsType[] = [
  "/",
  "/sign-up",
  "/pong",
  "/sign-in",
  "/profile",
  "/2fa",
];

export const NO_HIGHLIGHT_LINKS: ValidUrlPathsType[] = [];

export const SIGNED_IN_USER_REDIRECTION_PATH: ValidUrlPathsType = "/";
export const GUEST_USER_REDIRECTION_PATH: ValidUrlPathsType = "/sign-in";

export const NGINX_SERVER = "http://localhost:80";
