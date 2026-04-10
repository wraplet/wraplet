import { WrapletDependencies } from "../../Wraplet/types/WrapletDependencies";
import {
  MultipleDependencyKeys,
  SingleDependencyKeys,
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
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
   * The children map that defines the relationships between nodes.
   */
  map: WrapletDependencyMapWithDefaults<M>;

  /**
   * Instantiate dependencies based on the map and the current node.
   */
  instantiateDependencies(): void;

  /**
   * Initialize dependencies.
   */
  initializeDependencies(): Promise<void>;

  /**
   * Destroy all dependencies.
   */
  destroyDependencies(): Promise<void>;

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
