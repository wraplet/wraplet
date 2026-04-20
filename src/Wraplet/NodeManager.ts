export class NodeManager<N extends Node> {
  private listeners: {
    callback: EventListenerOrEventListenerObject;
    event: string;
    options?: AddEventListenerOptions | boolean;
  }[] = [];

  constructor(private node: N) {}

  public addListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.node.addEventListener(eventName, callback, options);
    this.listeners.push({
      callback,
      event: eventName,
      options: options,
    });
  }

  public destroy(): void {
    for (const listener of this.listeners) {
      this.node.removeEventListener(
        listener.event,
        listener.callback,
        listener.options,
      );
    }
    this.listeners.length = 0;
  }
}
