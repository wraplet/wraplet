import { WrapletDependencyMap } from "./WrapletDependencyMap";

export type DependencyInstance<
  M extends WrapletDependencyMap,
  K extends keyof M = keyof M,
> = InstanceType<M[K]["Class"]>;
