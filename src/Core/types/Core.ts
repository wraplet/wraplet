import { WrapletChildren } from "../../Wraplet/types/WrapletChildren";
import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../../Wraplet/types/WrapletChildrenMap";
import { DestroyChildListener } from "./DestroyChildListener";
import { InstantiateChildListener } from "./InstantiateChildListener";
import { Wraplet } from "../../Wraplet/types/Wraplet";
import { WrapletCreator } from "./WrapletCreator";
import { is } from "../../utils/is";
import { Status } from "../../Wraplet/types/Status";

const CoreSymbol = Symbol("ChildrenManager");
export { CoreSymbol };

/**
 * Children manager interface that defines the public API for managing wraplet relationships
 * and lifecycles.
 */
export interface Core<
  N extends Node = Node,
  M extends WrapletChildrenMap = {},
> {
  [CoreSymbol]: true;

  /**
   * Core status.
   */
  status: Status;

  /**
   * The children map that defines the relationships between nodes.
   */
  map: WrapletChildrenMapWithDefaults<M>;

  /**
   * Node attached to the current wraplet.
   */
  node: N;

  /**
   * Instantiate children based on the map and the current node.
   */
  instantiateChildren(): void;

  /**
   * Initialize children.
   */
  initializeChildren(): Promise<void>;

  /**
   * Synchronize the children instances with the DOM.
   */
  syncChildren(): Promise<void>;

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
  destroy(): Promise<void>;

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
  setWrapletCreator(
    wrapletCreator: WrapletCreator<Node, WrapletChildrenMap>,
  ): void;

  /**
   * Get the instantiated children.
   */
  readonly children: WrapletChildren<M>;
}

export function isCore(object: unknown): object is Core {
  return is(object, CoreSymbol);
}
