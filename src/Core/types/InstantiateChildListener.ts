import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { ChildInstance } from "./ChildInstance";

export type InstantiateChildListener<
  M extends WrapletChildrenMap,
  K extends keyof M,
> = (wraplet: ChildInstance<M, K>, id: K) => void;
