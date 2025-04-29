import Footer from "../components/Footer";
import Header from "../components/Header";
import { NGINX_SERVER } from "../constants";
import themeState from "../context/ThemeContext";
import { urlContext } from "../context/UrlContext";
import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";
import Router from "../models/Router";
import { removeElementsWithSimilarClassName } from "../utils/remove-elements-with-similar-class-name";

type Activate2FaResponseType = {
  dataUrl: string;
};

class Profile extends Component {
  static message2FaclassName = "message-2fa";
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  public static handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("sign-out-btn")) {
      Profile.signOut();
    } else if (target.classList.contains("activate-2fa-btn")) {
      Profile.activate2Fa();
    } else if (target.classList.contains("confirm-qrcode-scan-btn")) {
      Profile.confirmQrCodeScan();
    } else if (target.classList.contains("submit-2fa-activation-btn")) {
      Profile.submit2FaCodeActivation(event);
    } else if (target.classList.contains("deactivate-2fa-btn")) {
      Profile.deactivate2Fa();
    } else if (target.classList.contains("submit-2fa-deactivation-btn")) {
      Profile.submit2FaCodeDeactivation(event);
    }
  }

  public static async signOut() {
    try {
      // console.log("signing out");
      const response = await fetch(`${NGINX_SERVER}/api/sign-out`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!data.errorMessage) {
        userContext.setState({
          ...userContext.state,
          id: "",
          email: "",
          username: "",
          isSignedIn: false,
          jwtAccessToken: "",
        });
        const routeToGo = "/";
        urlContext.setState({ ...urlContext.state, path: routeToGo });
        window.history.pushState({}, "", routeToGo);
        await Router.redirect(routeToGo);
        // Header.highlightActiveNavLink();
      }
    } catch (error) {
      console.log(error);
    }
  }

  public static async activate2Fa() {
    const user = userContext.state;
    const main = document.querySelector(".main-container") as HTMLElement;

    try {
      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
      const has2Fa = await Router.is2FaActive(user);
      if (has2Fa) {
        const message2FaAlreadyActive = main.querySelector(
          ".already-active-2fa-message"
        );
        if (message2FaAlreadyActive) {
          main.removeChild(message2FaAlreadyActive);
        }
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="already-active-2fa-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, you have already activated 2FA!</p>`
        );
        return;
      }

      const response = await fetch(`${NGINX_SERVER}/api/activate-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      const data = (await response.json()) as Activate2FaResponseType;
      const { dataUrl } = data;

      const qrCode = main.querySelector(".qrcode");
      if (qrCode) {
        return;
      }
      main.insertAdjacentHTML(
        "beforeend",
        `
				<div class="${Profile.message2FaclassName} qrcode flex flex-col items-center gap-4">
					<img src=${dataUrl} width=200px alt=qrcode />
					<div class="activate-2fa-description text-center">
						<p>Please scan the QR Code using a two-factor authentication app,</p>
						<p>and only then click the <span class="italic">confirm 2FA</span> button</p>
					</div>
					<button class="confirm-qrcode-scan-btn theme-btn-${themeState.state} py-2 cursor-pointer w-[120px]">
						Confirm 2FA
					</button>
				</div>
				`
      );
    } catch (error) {
      console.log(error);
    }
  }

  public static async confirmQrCodeScan() {
    const main = document.querySelector(".main-container") as HTMLElement;

    removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
    // const descriptionText = document.querySelector(".activate-2fa-description");
    main.insertAdjacentHTML(
      "beforeend",
      `
				<div class="${Profile.message2FaclassName} flex flex-col items-center gap-4 mb-12">
					<p>Please confirm the 2FA activation by sending your 6-digit code</p>
					<form class="flex gap-4 items-center">
					<label for="confirm-2fa">2FA Code</label>
					<input class="theme-input-${themeState.state} px-2 py-1" type="number" id="confirm-2fa" name="confirm-2fa" />
					<button type="submit" class="theme-btn-${themeState.state} submit-2fa-activation-btn py-1 cursor-pointer w-[80px]">Submit</button>
					</form>
				</div>
			`
    );

    return;
  }

  public static async submit2FaCodeActivation(event: MouseEvent) {
    event.preventDefault();
    const user = userContext.state;
    const main = document.querySelector(".main-container") as HTMLElement;
    const input = document.getElementById("confirm-2fa") as HTMLInputElement;
    const code2Fa = input.value;
    try {
      const validationResponse = await fetch("/api/validate-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, code2Fa }),
        signal: AbortSignal.timeout(5000),
      });

      const validationData = await validationResponse.json();
      if (validationData.errorMessage) {
        throw validationData;
      }

      const response = await fetch(`${NGINX_SERVER}/api/confirm-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });
      await response.json();

      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);

      main.insertAdjacentHTML(
        "beforeend",
        `<p class="confirmed-2fa-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, 2FA is activated</p>`
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "errorMessage" in error &&
        error.errorMessage
      ) {
        removeElementsWithSimilarClassName("retry-submit-2fa", main);
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} retry-submit-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, ${error.errorMessage}</p>`
        );
      } else {
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, Something went wrong!</p>`
        );
      }
      console.log(error);
    }
  }

  public static create() {
    if (!customElements.getName(Profile)) {
      customElements.define("profile-component", Profile);
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

    main.addEventListener("click", Profile.handleClick);

    const html = `
				<div class="flex items-center justify-between mt-12 mb-6">
					<h1 class="text-5xl font-bold">Profile</h1>
					<button class="sign-out-btn theme-btn-secondary-${themeState.state} px-4 py-2 cursor-pointer">
						Sign out
					</button>
				</div>
				<div class="flex flex-col gap-1 mb-20">
					<p>id: ${userContext.state.id}</p>
					<p>email: ${userContext.state.email}</p>
					<p>username: ${userContext.state.username}</p>
				</div>
				<h2 class="text-3xl font-bold mb-6">Settings</h2>
				<div class="flex flex-col gap-2 w-[120px]">
					<button class="activate-2fa-btn theme-btn-${themeState.state} py-2 cursor-pointer">
					Activate 2FA
					</button>
					<button class="deactivate-2fa-btn theme-btn-${themeState.state} py-2 cursor-pointer">
					Deactivate 2FA
					</button>
				</di>
			`;

    main.insertAdjacentHTML("beforeend", html);

    const SignOutInstance = new Profile(
      { html: "", position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: main, position: "beforeend" },
      { element: Footer.create(), position: "beforeend" }
    );
    SignOutInstance.insertChildren();
    SignOutInstance.classList.add("page");

    return SignOutInstance;
  }

  public static async deactivate2Fa() {
    const main = document.querySelector(".main-container") as HTMLElement;
    const user = userContext.state;
    try {
      const response = await fetch("/api/has-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!data.has2Fa) {
        throw data;
      }
      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
      main.insertAdjacentHTML(
        "beforeend",
        `
					<div class="${Profile.message2FaclassName} flex flex-col items-center gap-4 mb-12">
						<p>Please confirm the 2FA deactivation by sending your 6-digit code</p>
						<form class="flex gap-4 items-center">
						<label for="confirm-2fa">2FA Code</label>
						<input class="theme-input-${themeState.state} px-2 py-1" type="number" id="confirm-2fa" name="confirm-2fa" />
						<button type="submit" class="theme-btn-${themeState.state} submit-2fa-deactivation-btn py-1 cursor-pointer w-[80px]">Submit</button>
						</form>
					</div>
				`
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "has2Fa" in error &&
        !error.has2Fa
      ) {
        removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, 2FA is not activated!</p>`
        );
      } else {
        console.log(error);
      }
    }

    return;
  }

  public static async submit2FaCodeDeactivation(event: MouseEvent) {
    event.preventDefault();
    const user = userContext.state;
    const main = document.querySelector(".main-container") as HTMLElement;
    const input = document.getElementById("confirm-2fa") as HTMLInputElement;
    const code2Fa = input.value;
    try {
      const validationResponse = await fetch("/api/validate-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, code2Fa }),
        signal: AbortSignal.timeout(5000),
      });

      const validationData = await validationResponse.json();
      if (validationData.errorMessage) {
        throw validationData;
      }

      const response = await fetch(`${NGINX_SERVER}/api/deactivate-2fa`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
        signal: AbortSignal.timeout(5000),
      });

      await response.json();
      removeElementsWithSimilarClassName(Profile.message2FaclassName, main);
      main.insertAdjacentHTML(
        "beforeend",
        `<p class="deactive-2fa-message message-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, you successfully deactivated the 2FA.</p>`
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "errorMessage" in error &&
        error.errorMessage
      ) {
        removeElementsWithSimilarClassName("retry-submit-2fa", main);
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="confirm-2fa-error-message ${Profile.message2FaclassName} retry-submit-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, ${error.errorMessage}</p>`
        );
      } else {
        main.insertAdjacentHTML(
          "beforeend",
          `<p class="deactive-2fa-error-message message-2fa theme-ternary-${themeState.state}-full p-2 mt-2">${userContext.state.username}, Something went wrong!</p>`
        );
      }
      console.log(error);
    }
  }
}

export default Profile;
