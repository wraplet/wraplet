import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { DependencyLifecycleListener } from "./DependencyLifecycleListener";

export type CoreInitOptions<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  dependencyInstantiatedListeners?: DependencyLifecycleListener<M, keyof M>[];
  dependencyInitializedListeners?: DependencyLifecycleListener<M, keyof M>[];
  dependencyDestroyedListeners?: DependencyLifecycleListener<M, keyof M>[];
};
