import Component from "../models/Component";

class Pong extends Component {
  constructor(childrenString: string = "", ...childrenElements: HTMLElement[]) {
    super(childrenString, ...childrenElements);
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
    const GameInstance = new Pong(container);
    GameInstance.renderChildren("beforeend");
    return GameInstance;
  }
}

export default Pong;
