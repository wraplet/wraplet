import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { DependencyLifecycleAsyncListener } from "./DependencyLifecycleAsyncListener";
import { DependencyLifecycleListener } from "./DependencyLifecycleListener";
import { Logger } from "../../Logger/types/Logger";

export type CoreInitOptions<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  dependencyInstantiatedListeners?: DependencyLifecycleListener<M, keyof M>[];
  dependencyInitializedListeners?: DependencyLifecycleAsyncListener<
    M,
    keyof M
  >[];
  dependencyDestroyedListeners?: DependencyLifecycleAsyncListener<M, keyof M>[];
  logger?: Logger;
};
