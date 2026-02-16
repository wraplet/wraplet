import { WrapletDependencies } from "../../Wraplet/types/WrapletDependencies";
import {
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../../Wraplet/types/WrapletDependencyMap";
import { DependencyDestroyedListener } from "./DestroyDependencyListener";
import { DependencyInstantiatedListener } from "./DependencyInstantiatedListener";
import { Wraplet } from "../../Wraplet/types/Wraplet";
import { WrapletCreator } from "./WrapletCreator";
import { is } from "../../utils/is";
import { Status } from "../../Wraplet/types/Status";

const CoreSymbol = Symbol("Core");
export { CoreSymbol };

/**
 * Dependency manager interface that defines the public API for managing wraplet relationships
 * and lifecycles.
 */
export interface Core<
  N extends Node = Node,
  M extends WrapletDependencyMap = {},
> {
  [CoreSymbol]: true;

  /**
   * Core status.
   */
  status: Status;

  /**
   * The children map that defines the relationships between nodes.
   */
  map: WrapletDependencyMapWithDefaults<M>;

  /**
   * Node attached to the current wraplet.
   */
  node: N;

  /**
   * Instantiate dependencies based on the map and the current node.
   */
  instantiateDependencies(): void;

  /**
   * Initialize dependencies.
   */
  initializeDependencies(): Promise<void>;

  /**
   * Synchronize the dependencies instances with the DOM.
   */
  syncDependencies(): Promise<void>;

  /**
   * Add a listener that will be called when a dependency is destroyed.
   */
  addDependencyDestroyedListener(
    callback: DependencyDestroyedListener<M, keyof M>,
  ): void;

  /**
   * Add a listener that will be called when a dependency is instantiated.
   */
  addDependencyInstantiatedListener(
    callback: DependencyInstantiatedListener<M, keyof M>,
  ): void;

  /**
   * Destroy all dependencies.
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

  getChildrenDependencies(): Wraplet[];

  /**
   * Allows for overriding the default wraplet creation process.
   */
  setWrapletCreator(
    wrapletCreator: WrapletCreator<Node, WrapletDependencyMap>,
  ): void;

  /**
   * Get the available dependencies.
   */
  readonly dependencies: WrapletDependencies<M>;
}

export function isCore(object: unknown): object is Core {
  return is(object, CoreSymbol);
}
