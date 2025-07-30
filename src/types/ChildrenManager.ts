import { WrapletChildren } from "./WrapletChildren";
import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { CommonMethods } from "../AbstractWraplet";
import { DestroyChildListener } from "./DestroyChildListener";
import { InstantiateChildListener } from "./InstantiateChildListener";
import { is } from "./Utils";

const CoreSymbol = Symbol("Core");
export { CoreSymbol };

/**
 * Core interface that defines the public API for managing wraplet relationships
 * and lifecycles.
 */
export interface ChildrenManager<
  M extends WrapletChildrenMap = {},
  N extends Node = Node,
  CM extends CommonMethods = CommonMethods,
> {
  [CoreSymbol]: true;

  /**
   * Indicates whether the core is destroyed.
   */
  isDestroyed: boolean;

  /**
   * Indicates whether the core is in the process of being destroyed.
   */
  isGettingDestroyed: boolean;

  /**
   * Indicates whether the core has been initialized.
   */
  isInitialized: boolean;

  /**
   * The children map that defines the relationships between nodes.
   */
  map: M;

  /**
   * Initialize the core.
   * This must be called after construction to fully initialize the core.
   */
  init(): void;

  /**
   * Instantiate children based on the map and the current node.
   */
  instantiateChildren(node: N): WrapletChildren<M>;

  /**
   * Synchronize the children instances with the DOM.
   */
  syncChildren(node: N): void;

  /**
   * Add a listener that will be called when a child is destroyed.
   */
  addDestroyChildListener(callback: DestroyChildListener<M, keyof M>): void;

  /**
   * Add a listener that will be called when a child is instantiated.
   */
  addInstantiateChildListener(
    callback: InstantiateChildListener<M, keyof M>,
  ): void;

  /**
   * Execute a method on all children.
   */
  executeOnChildren(
    children: WrapletChildren<M>,
    method: keyof CM & string,
    payload?: CM[keyof CM],
  ): void;

  /**
   * Destroy the core and all its children.
   */
  destroy(): void;

  /**
   * Add an event listener to a node and track it for cleanup.
   */
  addEventListener(
    node: Node,
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void;

  /**
   * Get the instantiated children.
   */
  readonly children: WrapletChildren<M>;

  /**
   * Get the partially initialized children (before initialization is complete).
   */
  readonly uninitializedChildren: Partial<WrapletChildren<M>>;
}

/* istanbul ignore next */
const isCore = (object: object): object is ChildrenManager => {
  return is<ChildrenManager>(object, CoreSymbol);
};

export { isCore };
