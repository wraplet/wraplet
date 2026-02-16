import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { DependencyInstance } from "../../Wraplet/types/DependencyInstance";

export type DependencyInstantiatedListener<
  M extends WrapletDependencyMap,
  K extends keyof M,
> = (wraplet: DependencyInstance<M, K>, id: K) => void;
