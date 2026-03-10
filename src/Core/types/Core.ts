import { WrapletDependencies } from "../../Wraplet/types/WrapletDependencies";
import {
  MultipleDependencyKeys,
  SingleDependencyKeys,
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../../Wraplet/types/WrapletDependencyMap";
import { Wraplet } from "../../Wraplet/types/Wraplet";
import { WrapletCreator } from "./WrapletCreator";
import { is } from "../../utils/is";
import { Status } from "../../Wraplet/types/Status";
import { DependencyLifecycleAsyncListener } from "./DependencyLifecycleAsyncListener";
import { DependencyLifecycleListener } from "./DependencyLifecycleListener";
import { DependencyInstance } from "../../Wraplet/types/DependencyInstance";

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
   * Add a listener that will be called when a dependency is initialized.
   */
  addDependencyInitializedListener(
    callback: DependencyLifecycleAsyncListener<M, keyof M>,
  ): void;

  /**
   * Add a listener that will be called when a dependency is destroyed.
   */
  addDependencyDestroyedListener(
    callback: DependencyLifecycleAsyncListener<M, keyof M>,
  ): void;

  /**
   * Add a listener that will be called when a dependency is instantiated.
   */
  addDependencyInstantiatedListener(
    callback: DependencyLifecycleListener<M, keyof M>,
  ): void;

  /**
   * This method allows you to set an existing dependency instance.
   *
   * It can be used only before the instantiation phase.
   */
  setExistingInstance<
    K extends SingleDependencyKeys<M> & Extract<keyof M, string>,
  >(
    id: K,
    wraplet: DependencyInstance<M, K>,
  ): void;

  /**
   * This method allows you to add an existing dependency instance
   * to a wraplet set.
   *
   * It can be used only before the instantiation phase.
   */
  addExistingInstance<
    K extends MultipleDependencyKeys<M> & Extract<keyof M, string>,
  >(
    id: K,
    wraplet: DependencyInstance<M, K>,
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
