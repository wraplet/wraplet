import { InstantiateChildListener } from "./InstantiateChildListener";
import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { DestroyChildListener } from "./DestroyChildListener";

export type CoreInitOptions<M extends WrapletChildrenMap> = {
  instantiateChildListeners: InstantiateChildListener<M, keyof M>[];
  destroyChildListeners: DestroyChildListener<M, keyof M>[];
};
