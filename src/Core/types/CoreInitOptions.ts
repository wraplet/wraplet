import { DependencyInstantiatedListener } from "./DependencyInstantiatedListener";
import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { DependencyDestroyedListener } from "./DestroyDependencyListener";

export type CoreInitOptions<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  dependencyInstantiatedListeners?: DependencyInstantiatedListener<
    M,
    keyof M
  >[];
  dependencyDestroyedListeners?: DependencyDestroyedListener<M, keyof M>[];
};
