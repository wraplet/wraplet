import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { Core } from "../../Core/types/Core";
import { DestroyListener } from "../../Core/types/DestroyListener";
import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryBasicCallback";
import { Wraplet } from "./Wraplet";

export type WrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  core: Core<N, M>;
  wraplet: Wraplet<N>;
  destroyListeners?: DestroyListener<Wraplet<N>>[];
  initializeCallback?: WrapletApiFactoryBasicCallback;
  destroyCallback?: WrapletApiFactoryBasicCallback;
};
