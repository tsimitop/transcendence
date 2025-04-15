import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROUTER_CLASS_NAME } from "../constants";
import themeState from "../context/ThemeContext";
import { userContext } from "../context/UserContext";
import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Home extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create(): Home {
    if (!customElements.getName(Home)) {
      customElements.define("home-component", Home);
    }
    // const html = `
    // 	<div class="bg-[linear-gradient(to_right,rgba(255,183,3,0.5),rgba(255,233,179,0.5))] h-[50vh] opacity-70 flex">
    // 		<h1 class="flex flex-col items-center justify-center grow-1 text-9xl">
    // 				<p>Press</p>
    // 				<p>Start</p>
    // 		</h1>
    // 	</div>
    // 	<main class="theme-primary-${
    //     themeState.state
    //   }-full main-container layout-padding">
    // 		<h1>Welcome ${userContext.state.username || userContext.state.email}</h1>
    // 	</main>
    // `;

    const html = `
    	<div class="bg-[linear-gradient(to_right,rgba(0,0,0,0.6),rgba(255,255,255,0.6)),url('/src/assets/hero.jpg')] bg-cover bg-top h-screen opacity-50 relative">
				<h1 class="absolute bottom-[30%] left-[50%] transform -translate-x-1/2 text-5xl">
					${
            userContext.state.isSignedIn
              ? `
							<span>
								Welcome
							</span>
							<span class="font-bold">
								${userContext.state.username || userContext.state.email}
							</span>
							`
              : `<span class='font-["Press_Start_2P"]'><a class="${ROUTER_CLASS_NAME} hover:border-b-5" href="/pong">Press Start</a></span>`
          }	
				</h1>
    	</div>
    	<main class="theme-primary-${
        themeState.state
      }-full main-container layout-padding">
    	</main>
    `;
    // const html = `
    // 	<div style="background: linear-gradient(to top right, rgba(255, 184, 3, 0.5), rgba(255, 233, 179, 0.5)), url(/src/assets/hero.jpg) no-repeat bottom 30% right/cover" class="bg-cover h-[100vh] opacity-80 bg-[bottom_20%_right_60%]">
    // 	</div>
    // 	<main class="theme-primary-${
    //     themeState.state
    //   }-full main-container layout-padding">
    // 		<h1>Welcome ${userContext.state.username || userContext.state.email}</h1>
    // 	</main>
    // `;
    // const html = `
    // <div class="bg-linear-to-r from-test1 to-test2 h-[100vh] opacity-60">
    // 	<div class="bg-[url(/src/assets/hero.png)] bg-cover h-[100vh] opacity-80 bg-[bottom_20%_right_60%]">
    // 	</div>
    // </div>
    // 	<main class="theme-primary-${
    //     themeState.state
    //   }-full main-container layout-padding">
    // 		<h1>Welcome ${userContext.state.username || userContext.state.email}</h1>
    // 	</main>
    // `;
    const HomeInstance = new Home(
      { html, position: "beforeend" },
      { element: Header.create(), position: "afterbegin" },
      { element: Footer.create(), position: "beforeend" }
    );
    HomeInstance.insertChildren();
    HomeInstance.classList.add("page");
    return HomeInstance;
  }
}

export default Home;
