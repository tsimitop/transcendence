import StateManager from "../models/StateManager";
import { PAGES, ValidUrlPathsType } from "../constants";

export type UrlStateType = {
  path: string | undefined;
  // query: string;
};

class UrlContext extends StateManager<UrlStateType> {
  constructor(state: UrlStateType) {
    super(state);
  }

  public static getValidUrlPath(): ValidUrlPathsType | undefined {
    const urlPath = window.location.pathname;
    const validUrlPath = PAGES.find(page => page === urlPath);
    return validUrlPath;
  }
}

const validUrlPath = UrlContext.getValidUrlPath();

export const urlContext = new UrlContext({
  path: validUrlPath,
});

export default UrlContext;
