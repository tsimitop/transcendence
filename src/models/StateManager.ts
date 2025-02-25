type StateListener<T> = (prevState: T, newState: T) => void;

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
    this.callListener(previousState, newState);
  }

  public subscribeListener(listener: StateListener<T>): void {
    this._listeners.push(listener);
  }

  public callListener(prevState: T, newState: T): void {
    this._listeners.forEach(listener => listener(prevState, newState));
  }
}

export default StateManager;
