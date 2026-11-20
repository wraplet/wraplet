import { isParentNode } from "../NodeTreeManager/utils";
import { SelectorCallback } from "./types/WrapletDependencyDefinition";

import { Wireable, Wiring } from "./composeWrapletApi";

type Listener = {
  callback: EventListenerOrEventListenerObject;
  event: string;
  options?: AddEventListenerOptions | boolean;
};

export class NodeManager<N extends Node> implements Wireable {
  private listeners: Map<Node, Listener[]> = new Map();
  private observers: Map<Node, MutationObserver[]> = new Map();

  constructor(public node: N) {}

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
    const nodes = this.findDescendants(target, required);
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

  public addObserver(callback: MutationCallback, init?: MutationObserverInit) {
    this.addObserverToNode(this.node, callback, init);
  }

  public addObserverTo(
    target: SelectorCallback | string,
    callback: MutationCallback,
    init?: MutationObserverInit,
    required: boolean = true,
  ) {
    const nodes = this.findDescendants(target, required);
    for (const node of nodes) {
      this.addObserverToNode(node, callback, init);
    }
  }

  public destroy(): void {
    // Clear listeners.
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

    // Clear observers.
    for (const observersData of this.observers) {
      const observers = observersData[1];
      for (const observer of observers) {
        observer.disconnect();
      }
    }

    this.observers.clear();
  }

  public wiring(): Wiring {
    return {
      destroyCallback: async () => {
        this.destroy();
      },
    };
  }

  private addObserverToNode(
    node: Node,
    callback: MutationCallback,
    init?: MutationObserverInit,
  ) {
    const observers = this.observers.get(node) || [];
    const observer = new MutationObserver(callback);
    observer.observe(node, init);
    observers.push(observer);
    this.observers.set(node, observers);
  }

  private findDescendants(
    target: SelectorCallback | string,
    required: boolean,
  ): Node[] {
    if (!isParentNode(this.node)) {
      throw new Error("Target node is not a parent node.");
    }
    const nodes: Node[] = [];
    if (typeof target === "string") {
      nodes.push(...Array.from(this.node.querySelectorAll(target)));
    } else {
      nodes.push(...target(this.node));
    }

    if (required && nodes.length === 0) {
      throw new Error("No nodes found.");
    }

    return nodes;
  }
}
