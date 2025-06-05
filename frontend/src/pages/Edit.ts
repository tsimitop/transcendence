import Footer from "../components/Footer";
import Header from "../components/Header";
import themeState from "../context/ThemeContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import { CADDY_SERVER } from "../constants";
import { userContext } from "../context/UserContext";
import { displayFormValidationError, clearFormValidationError } from "../utils/display-form-validation-error";

class Edit extends Component {
  static validationErrorClassName = "edit-validation-error";
  
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
  <div class="form-and-validation-container mt-12 mb-6">
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
		  <div class="relative flex items-center gap-2">
		    <button class="change-username-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
              Change
            </button>
		    <span class="username-success hidden text-green-600">&#10003;</span>
		  </div>
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
		  <div class="relative flex items-center gap-2">
		    <button class="change-email-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
              Change
            </button>
		    <span class="email-success hidden text-green-600">&#10003;</span>
		  </div>
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
		  <div class="relative flex items-center gap-2">
		    <button class="change-password-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
              Change
            </button>
		    <span class="password-success hidden text-green-600">&#10003;</span>
		  </div>
        </div>
      </div>
      <div class="flex flex-col">
        <label for="avatar-input" class="mb-1 text-lg font-semibold">Avatar</label>
		<div class="flex gap-2">
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            class="avatar-input theme-input-${themeState.state} px-4 py-2 rounded border border-gray-300"
          />
		  <div class="relative flex items-center gap-2">
            <button class="change-avatar-btn px-4 py-2 theme-btn-${themeState.state} cursor-pointer">
              Upload
            </button>
		    <span class="avatar-success hidden text-green-600">&#10003;</span>
		  </div>
        </div>
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
    }else if (target.classList.contains("change-avatar-btn")) {
	  const input = document.getElementById("avatar-input") as HTMLInputElement | null;
	  if (input && input.files && input.files[0]) {
		Edit.uploadNewAvatar(input.files[0]);
	  } else {
		alert("Please select an image file.");
	  }
	}
  }

  //green check after successful update of element
  private static showSuccess(action: "username" | "email" | "password" | "avatar") {
  const successIndicator = document.querySelector(`.${action}-success`) as HTMLElement;
  if (successIndicator) {
    successIndicator.classList.remove("hidden");
    successIndicator.classList.add("animate-pulse");

    setTimeout(() => {
      successIndicator.classList.add("hidden");
      successIndicator.classList.remove("animate-pulse");
    }, 3000); // auto-hide after 3 seconds
  }
  }

  public static async uploadNewAvatar(file: File) {
    const user = userContext.state;
    const formData = new FormData();
    formData.append("userId", user.id); // id MUST be first, otherwise userId undefined in the backend
    formData.append("avatar", file);
	let result;
	const getValidationContainer = () => document.querySelector(".form-and-validation-container")! as HTMLElement;
    try {
      const response = await fetch(`${CADDY_SERVER}/api/editing/avatar`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
		let errorMessage = "Failed to upload avatar.";
		try {

		result = await response.json();
		displayFormValidationError(
          Edit.validationErrorClassName,
          getValidationContainer(),
          result?.errorMessage || "Failed to upload avatar."
        );

		//   alert(result.errorMessage);// || "Failed to upload avatar."
		} catch (error) {
			console.error(`Response body not a valid JSON->errorMessage: ${errorMessage}`);
			return;
		}
		console.error(`Response not OK`);
        return;
      }
 	//   result = await response.json();
 	//   alert(`${result.message}, userId: ${user.id}`);
	Edit.showSuccess("avatar");
 	//   console.log("Server response:", result);
    //   alert("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
    //   alert("Upload failed. Check console.");
	  displayFormValidationError(
        Edit.validationErrorClassName,
        getValidationContainer(),
        "Failed to upload avatar due to a network or server error."
      );
	  return;
    }
	Edit.showSuccess("avatar");
	clearFormValidationError(Edit.validationErrorClassName);
  }


  public static async updateInfo(newTerm: string, action: 'username' | 'email') {
    const user = userContext.state;
    const newValue = newTerm?.trim();  
	const getValidationContainer = () => document.querySelector(".form-and-validation-container")! as HTMLElement;
    if (!newValue) {
	  displayFormValidationError(
        Edit.validationErrorClassName,
        getValidationContainer(),
        `Please enter a new ${action}.`
        );
    //   console.error(`No ${action} provided.`);
    //   alert(`No ${action} provided.`);
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
        // console.error(errorData.errorMessage);
        // alert(errorData.errorMessage);
		displayFormValidationError(
          Edit.validationErrorClassName,
          getValidationContainer(),
          errorData.errorMessage || `Failed to update ${action}.`
        );
  	  return;
  	}
    } catch (error) {
  	  console.error(`Error performing ${action}:`, error);
    }
	Edit.showSuccess(`${action}`);
	clearFormValidationError(Edit.validationErrorClassName);
  }

  public static async updatePassword(oldPass: string, newPass: string) {
    const user = userContext.state;  
	const getValidationContainer = () => document.querySelector(".form-and-validation-container")! as HTMLElement;
    if (!oldPass || !newPass) {
      displayFormValidationError(
        Edit.validationErrorClassName,
        getValidationContainer(),
        "Please provide both old and new passwords."
      );
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
          displayFormValidationError(
            Edit.validationErrorClassName,
            getValidationContainer(),
            errorData.errorMessage || "Password update failed."
          );
  	    return;
	  }
    } catch (error) {
  	  console.error(`Error performing password change:`, error);
    }
	Edit.showSuccess("password");
	clearFormValidationError(Edit.validationErrorClassName);
  }
}

export default Edit;