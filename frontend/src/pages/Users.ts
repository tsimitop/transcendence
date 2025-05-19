import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Users extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create(): Users {
    if (!customElements.getName(Users)) {
      customElements.define("users-component", Users);
    }
  
    const searchLink = document.getElementById('search-link');
    const userSearchInput = document.getElementById('user-searched') as HTMLInputElement;
    const searchTerm = userSearchInput?.value.trim();
    let html: string;

    if (!searchTerm) {
      html = `
        <main class="
          theme-primary-${themeState.state}-full main-container layout-padding"
        >
          <h1>No profile selected</h1>
        </main>
      `;
    } else {
      html = `
        <main class="
          theme-primary-${themeState.state}-full main-container layout-padding"
        >
          <h1>Users html reached</h1>
          <h1>searchLink: ${searchLink}</h1>
          <h1>userSearchInput: ${userSearchInput}</h1>
          <h1>searchTerm: ${searchTerm}</h1>
        </main>
      `;
    }
  
    const usersInstance = new Users(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    usersInstance.insertChildren();
    usersInstance.classList.add("page");
    return usersInstance;
  }
}

export default Users;
