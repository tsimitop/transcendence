import Component, {
  ChildElementType,
  ChildrenStringType,
} from "../models/Component";

class Pong extends Component {
  constructor(
    childrenString: ChildrenStringType,
    ...childElements: ChildElementType[]
  ) {
    super(childrenString, ...childElements);
  }

  static create() {
    if (!customElements.getName(Pong)) {
      customElements.define("game-component", Pong);
    }

    const container = `
			<div>
				<h1>Pong</h1>
				<a href='/'>To Home</a>
			</div>
		`;
    const GameInstance = new Pong({ html: container, position: "beforeend" });
    GameInstance.insertChildren();
    return GameInstance;
  }
}

export default Pong;
