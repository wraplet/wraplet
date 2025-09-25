import { WrapletChildren } from "./WrapletChildren";
import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "./WrapletChildrenMap";
import { DestroyChildListener } from "./DestroyChildListener";
import { InstantiateChildListener } from "./InstantiateChildListener";
import { is } from "./Utils";
import { NodeTreeParent, NodeTreeParentSymbol } from "./NodeTreeParent";
import { Wraplet } from "./Wraplet";
import { WrapletCreator } from "./WrapletCreator";

const CoreSymbol = Symbol("ChildrenManager");
export { CoreSymbol };

/**
 * Children manager interface that defines the public API for managing wraplet relationships
 * and lifecycles.
 */
export interface Core<M extends WrapletChildrenMap = {}, N extends Node = Node>
  extends NodeTreeParent {
  [CoreSymbol]: true;
  [NodeTreeParentSymbol]: true;
  /**
   * Indicates whether the core is destroyed.
   */
  isDestroyed: boolean;

  /**
   * Indicates whether the core is in the process of being destroyed.
   */
  isGettingDestroyed: boolean;

  /**
   * Indicates whether the core is in the process of being initialized.
   */
  isGettingInitialized: boolean;

  /**
   * Indicates whether the core has been initialized.
   */
  isInitialized: boolean;

  /**
   * The children map that defines the relationships between nodes.
   */
  map: WrapletChildrenMapWithDefaults<M>;

  /**
   * Node attached to the current wraplet.
   */
  node: N;

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

  getNodeTreeChildren(): Wraplet[];

  /**
   * Allows for overriding the default wraplet creation process.
   */
  setWrapletCreator(wrapletCreator: WrapletCreator<N, M>): void;

  /**
   * Get the instantiated children.
   */
  readonly children: WrapletChildren<M>;

  /**
   * Get the partially initialized children (before initialization is complete).
   */
  readonly uninitializedChildren: Partial<WrapletChildren<M>>;
}

export function isCore(object: unknown): object is Core {
  return is(object, CoreSymbol);
}
