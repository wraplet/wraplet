import { WrapletChildren } from "./WrapletChildren";
import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "./WrapletChildrenMap";
import { DestroyChildListener } from "./DestroyChildListener";
import { InstantiateChildListener } from "./InstantiateChildListener";

const ChildrenManagerSymbol = Symbol("ChildrenManager");
export { ChildrenManagerSymbol };

/**
 * Children manager interface that defines the public API for managing wraplet relationships
 * and lifecycles.
 */
export interface ChildrenManager<
  M extends WrapletChildrenMap = {},
  N extends Node = Node,
> {
  [ChildrenManagerSymbol]: true;

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
  map: WrapletChildrenMapWithDefaults<M>;

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
  syncChildren(): void;

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
   * Destroy all children.
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
