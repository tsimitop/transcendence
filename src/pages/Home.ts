import Component from "../models/Component";

export class Home extends Component {
  constructor(
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ) {
    super(childrenString, childrenElements);
  }

  static create(): Home {
    customElements.define("home-component", Home);
    const header = "<h1>Homepage</h1>";
    const paragraph = document.createElement("p");
    paragraph.innerText = "paragraph";
    const HomeInstance = new Home(header, paragraph);
    HomeInstance.renderChildren("beforeend");
    return HomeInstance;
  }
}
