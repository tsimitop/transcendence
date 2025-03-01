export type StateListener<T> = {
  name: string;
  listen: (prevState: T, newState: T) => void;
};

abstract class StateManager<T> {
  private _state: T;
  private _listeners: StateListener<T>[];
  constructor(initialState: T) {
    this._state = initialState;
    this._listeners = [];
  }

  public get state(): T {
    return this._state;
  }

  public set state(newState: T) {
    const previousState = this._state;
    this._state = newState;
    this.callListeners(previousState, newState);
  }

  public subscribeListener(newListener: StateListener<T>): void {
    const listenerExists = this._listeners.find(
      listener => listener.name === newListener.name
    );

    if (listenerExists) {
      console.log("listener exists");
      return;
    }

    console.log("listener added");
    this._listeners.push(newListener);
  }

  public callListeners(prevState: T, newState: T): void {
    console.log(this._listeners);
    this._listeners.forEach(listener => listener.listen(prevState, newState));
  }
}

export default StateManager;
