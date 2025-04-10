export const ROUTER_CLASS_NAME = "router-link";

export type ValidUrlPathsType =
  | "/"
  | "/sign-up"
  | "/pong"
  | "/sign-in"
  | "/profile";

export const PAGES: ValidUrlPathsType[] = [
  "/",
  "/sign-up",
  "/pong",
  "/sign-in",
  "/profile",
];

export const NO_HIGHLIGHT_LINKS: ValidUrlPathsType[] = ["/profile"];
