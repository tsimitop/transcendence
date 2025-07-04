export type StateListener<T> = {
  id: string;
  listen: (prevState: T, newState: T) => void;
};

abstract class StateManager<T> {
  private _state: T;
  private _listeners: StateListener<T>[];
  constructor(state: T) {
    this._state = state;
    this._listeners = [];
  }

  public get state(): T {
    return this._state;
  }

  protected set state(newState: T) {
    this._state = newState;
  }

  public setState(newState: T) {
    const previousState = this._state;
    this._state = newState;
    this.callListeners(previousState, newState);
  }

  public subscribeListener(newListener: StateListener<T>): void {
    this._listeners = this._listeners.filter(
      listener => listener.id !== newListener.id
    );

    this._listeners.push(newListener);
  }

  public callListeners(prevState: T, newState: T): void {
    this._listeners.forEach(listener => listener.listen(prevState, newState));
  }
}

export default StateManager;
