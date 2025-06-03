import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { CADDY_SERVER } from "../constants";
import { userContext } from "../context/UserContext";
// import { displayFormValidationError } from "../utils/display-form-validation-error";

// import Router from "../models/Router";

class Edit extends Component {
//   static validationErrorClassName = "edit-validation-error";
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }


  public static create() {
      if (!customElements.getName(Edit)) {
      customElements.define("edit-component", Edit);
    }

    const main = document.createElement("main");
    main.classList.add(
      "main-container",
      "layout-padding",
      `${
        themeState.state === "light"
          ? "theme-primary-light-full"
          : "theme-primary-dark-full"
      }`
    );
	
		const user = userContext.state;
const html = `
  <div class="mt-12 mb-6">
    <h1 class="text-5xl font-bold mb-6">Update your info</h1>
    <div class="flex flex-col gap-6 w-full max-w-md">
      <div class="flex flex-col">
        <label for="name-input" class="mb-1 text-lg font-semibold">Username: ${user.username}</label>
		<div class="flex gap-2">
          <input
            id="name-input"
            type="text"
            placeholder="Enter your new username"
            class="name-input theme-input-${themeState.state} px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
          />
		  <button class="change-username-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
            Change
          </button>
        </div>
      </div>
      <div class="flex flex-col">
        <label for="email-input" class="mb-1 text-lg font-semibold">Email: ${user.email}</label>
		<div class="flex gap-2">
          <input
            id="email-input"
            type="email"
            placeholder="Enter your new email"
            class="email-input theme-input-${themeState.state} px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
          />
		  <button class="change-email-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
            Change
          </button>
        </div>
      </div>
      <div class="flex flex-col">
        <label for="password-input" class="mb-1 text-lg font-semibold">Password</label>
		<div class="flex gap-2">
		  <input
            id="password-input-old"
            type="password"
            placeholder="Enter old password"
            class="password-input theme-input-${themeState.state} px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
          />
          <input
            id="password-input-new"
            type="password"
            placeholder="Enter new password"
            class="password-input theme-input-${themeState.state} px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
          />
		  <button class="change-password-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
            Change
          </button>
        </div>
      </div>
      <div class="flex flex-col">
        <label for="avatar-input" class="mb-1 text-lg font-semibold">Avatar</label>
        <input
          id="avatar-input"
          type="text"
          placeholder="Enter avatar URL"
          class="avatar-input theme-input-${themeState.state} px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
        />
      </div>
    </div>
  </div>
`;
    main.addEventListener("click", Edit.handleClick);


    main.insertAdjacentHTML("beforeend", html);

    const EditInstance = new Edit(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
	  { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    EditInstance.insertChildren();
    EditInstance.classList.add("page");

    return EditInstance;
}

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("change-username-btn")) {
	  const input = document.getElementById("name-input") as HTMLInputElement;
      if (input) Edit.updateInfo(input.value, "username");
    } else if (target.classList.contains("change-email-btn")) {
	  const input = document.getElementById("email-input") as HTMLInputElement;
      if (input) Edit.updateInfo(input.value, "email");
    } else if (target.classList.contains("change-password-btn")) {
	  const inputOld = document.getElementById("password-input-old") as HTMLInputElement;
	  const inputNew = document.getElementById("password-input-new") as HTMLInputElement;
      Edit.updatePassword(inputOld.value, inputNew.value);
    // }else if (target.classList.contains("change-avatar-btn")) {
    //   Edit.updateInfo(event, "avatar");
    }
  }

    public static async updateInfo(newTerm: string, action: 'username' | 'email') {
	  const user = userContext.state;
	  const newValue = newTerm?.trim();

      if (!newValue) {
        console.error(`No ${action} provided.`);
        alert(`No ${action} provided.`);
        return;
      }
	  try {
		const response = await fetch(`${CADDY_SERVER}/api/editing/${action}`, {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		  },
		  credentials: "include",
		  body: JSON.stringify({ user, newValue })
		});
	
		if (!response.ok) {
		  const errorData = await response.json();
          console.error(`Error performing ${action} change`);
          console.error(errorData.errorMessage);
          alert(errorData.errorMessage);
		  return;
		}
	  } catch (error) {
		console.error(`Error performing ${action}:`, error);
	  }
	}

	public static async updatePassword(oldPass: string, newPass: string) {
	  const user = userContext.state;

      if (!oldPass) {
        alert(`Please provide your old passsword.`);
        return;
      }

	  if (!newPass) {
        alert(`Please provide your new passsword.`);
        return;
      }

	  try {
		const response = await fetch(`${CADDY_SERVER}/api/editing/password`, {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		  },
		  credentials: "include",
		  body: JSON.stringify({ user, oldPass, newPass })
		});
	
		if (!response.ok) {
		  const errorData = await response.json();
          console.error(`Error performing password change`);
          console.error(errorData.errorMessage);
          alert(errorData.errorMessage);
		  return;
		}
	  } catch (error) {
		console.error(`Error performing password change:`, error);
	  }
	}
}

export default Edit;