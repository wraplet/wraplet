import { WrapletChildrenMap } from "./WrapletChildrenMap";

export type ChildInstance<
  M extends WrapletChildrenMap,
  K extends keyof M = keyof M,
> = InstanceType<M[K]["Class"]>;
