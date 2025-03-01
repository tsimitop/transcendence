import StateManager from "../models/StateManager";
import { PAGES } from "../constants";

export type UrlState = {
  path: string;
  // query: string;
};

class UrlContext extends StateManager<UrlState> {
  constructor(initialState: UrlState) {
    super(initialState);
  }
}

const urlPath = window.location.pathname;
const validPath = PAGES.find(page => page === urlPath);

export const urlState = new UrlContext({
  path: validPath ? urlPath : "",
});

export default UrlContext;
