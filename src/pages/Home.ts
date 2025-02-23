import Component from "../models/Component";

export class Home extends Component {
  constructor(
    childrenString: string = "",
    childrenElements: HTMLElement | null = null
  ) {
    super(childrenString, childrenElements);
  }
}
