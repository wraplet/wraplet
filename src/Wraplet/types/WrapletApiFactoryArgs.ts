import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { Core } from "../../Core/types/Core";
import { DestroyListener } from "../../Core/types/DestroyListener";
import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryBasicCallback";
import { Status } from "./Status";
import { Wraplet } from "./Wraplet";

export type WrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletChildrenMap = WrapletChildrenMap,
> = {
  core: Core<N, M>;
  wraplet: Wraplet<N>;
  status?: Status;
  destroyListeners?: DestroyListener<N>[];
  initializeCallback?: WrapletApiFactoryBasicCallback;
  destroyCallback?: WrapletApiFactoryBasicCallback;
};
