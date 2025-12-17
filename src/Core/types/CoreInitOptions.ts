import { InstantiateChildListener } from "./InstantiateChildListener";
import { WrapletChildrenMap } from "../../Wraplet/types/WrapletChildrenMap";
import { DestroyChildListener } from "./DestroyChildListener";

export type CoreInitOptions<M extends WrapletChildrenMap = WrapletChildrenMap> =
  {
    instantiateChildListeners: InstantiateChildListener<M, keyof M>[];
    destroyChildListeners: DestroyChildListener<M, keyof M>[];
  };
