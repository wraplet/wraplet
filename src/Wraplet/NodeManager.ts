import { isParentNode } from "../NodeTreeManager/utils";
import { SelectorCallback } from "./types/WrapletDependencyDefinition";

type Listener = {
  callback: EventListenerOrEventListenerObject;
  event: string;
  options?: AddEventListenerOptions | boolean;
};

export class NodeManager<N extends Node> {
  private listeners: Map<Node, Listener[]> = new Map();

  constructor(private node: N) {}

  /**
   * Add a listener to the current node.
   */
  public addListener(
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.node.addEventListener(eventName, callback, options);
    const listeners = this.listeners.get(this.node) || [];
    listeners.push({
      callback,
      event: eventName,
      options: options,
    });
    this.listeners.set(this.node, listeners);
  }

  /**
   * Add a listener to one of the descendants.
   *
   * Note: Most of the time it's not recommended to use this
   * method because it makes a wraplet impure.
   *
   * Ideally, wraplet should directly interact only with its
   * own node. However, you can make a wraplet impure if you
   * know what you are doing.
   */
  public addListenerTo(
    target: SelectorCallback | string,
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
    required: boolean = true,
  ) {
    if (!isParentNode(this.node)) {
      throw new Error(
        "Target node is not a parent node. Cannot add listener to its child.",
      );
    }
    const nodes: Node[] = [];
    if (typeof target === "string") {
      nodes.push(...Array.from(this.node.querySelectorAll(target)));
    } else {
      nodes.push(...target(this.node));
    }

    if (required && nodes.length === 0) {
      throw new Error("No nodes found");
    }

    for (const node of nodes) {
      node.addEventListener(eventName, callback, options);
      const listeners = this.listeners.get(node) || [];
      listeners.push({
        event: eventName,
        callback,
        options,
      });
      this.listeners.set(node, listeners);
    }
  }

  public destroy(): void {
    for (const listenerData of this.listeners) {
      const node = listenerData[0];
      const listeners = listenerData[1];
      for (const listener of listeners) {
        node.removeEventListener(
          listener.event,
          listener.callback,
          listener.options,
        );
      }
    }
    this.listeners.clear();
  }
}
