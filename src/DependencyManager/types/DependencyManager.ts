import { WrapletDependencies } from "../../Wraplet/types/WrapletDependencies";
import {
  MultipleDependencyKeys,
  SingleDependencyKeys,
  WrapletDependencyMap,
} from "../../Wraplet/types/WrapletDependencyMap";
import { is } from "../../utils/is";
import { DependencyLifecycleAsyncListener } from "./DependencyLifecycleAsyncListener";
import { DependencyLifecycleListener } from "./DependencyLifecycleListener";
import { DependencyInstance } from "../../Wraplet/types/DependencyInstance";

export const DependencyManagerSymbol = Symbol("DependencyManager");

/**
 * Dependency manager interface that defines the public API for managing wraplet relationships
 * and lifecycles.
 */
export interface DependencyManager<
  N extends Node = Node,
  M extends WrapletDependencyMap = {},
> {
  [DependencyManagerSymbol]: true;

  /**
   * The node that the manager is managing.
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
   * Synchronizes dependencies in the DOM.
   *
   * When new nodes were added to the DOM, you might want to
   * synchronize the DependencyManager to inject new dependencies
   * that might be available.
   *
   * Dependencies that are no longer part of the descendant DOM tree
   * will be destroyed unless they are marked "destructable: false"
   * or have no "selector" property on the map.
   *
   * This is an experimental feature.
   *
   * @experimental
   */
  syncDependencies(): Promise<void>;

  /**
   * Destroy all dependencies.
   */
  destroyDependencies(): Promise<void>;

  /**
   * Add a listener that will be called when a dependency is initialized.
   */
  addDependencyInitializedListener<K extends keyof M>(
    id: K,
    callback: DependencyLifecycleAsyncListener<M, K>,
  ): void;

  /**
   * Add a listener that will be called when a dependency is destroyed.
   */
  addDependencyDestroyedListener<K extends keyof M>(
    id: K,
    callback: DependencyLifecycleAsyncListener<M, K>,
  ): void;

  /**
   * Add a listener that will be called when a dependency is instantiated.
   */
  addDependencyInstantiatedListener<K extends keyof M>(
    id: K,
    callback: DependencyLifecycleListener<M, K>,
  ): void;

  /**
   * This method allows you to set an existing dependency instance.
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
   */
  addExistingInstance<
    K extends MultipleDependencyKeys<M> & Extract<keyof M, string>,
  >(
    id: K,
    wraplet: DependencyInstance<M, K>,
  ): void;

  /**
   * Get the available dependencies.
   */
  readonly dependencies: WrapletDependencies<M>;
}

export function isDependencyManager<
  N extends Node,
  M extends WrapletDependencyMap,
>(object: unknown): object is DependencyManager<N, M> {
  return is(object, DependencyManagerSymbol);
}
