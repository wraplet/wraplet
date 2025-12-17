import { WrapletChildrenMap } from "../../Wraplet/types/WrapletChildrenMap";
import { ChildInstance } from "../../Wraplet/types/ChildInstance";

export type InstantiateChildListener<
  M extends WrapletChildrenMap,
  K extends keyof M,
> = (wraplet: ChildInstance<M, K>, id: K) => void;
