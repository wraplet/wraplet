import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { DependencyLifecycleAsyncListener } from "./DependencyLifecycleAsyncListener";
import { DependencyLifecycleListener } from "./DependencyLifecycleListener";
import { Logger } from "../../Logger/types/Logger";

export type DDMOptions<M extends WrapletDependencyMap = WrapletDependencyMap> =
  {
    dependencyInstantiatedListeners?: Map<
      keyof M,
      DependencyLifecycleListener<M, keyof M>[]
    >;
    dependencyInitializedListeners?: Map<
      keyof M,
      DependencyLifecycleAsyncListener<M, keyof M>[]
    >;
    dependencyDestroyedListeners?: Map<
      keyof M,
      DependencyLifecycleAsyncListener<M, keyof M>[]
    >;
    logger?: Logger;
  };
