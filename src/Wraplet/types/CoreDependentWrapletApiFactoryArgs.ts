import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryBasicCallback";
import { Wraplet } from "./Wraplet";
import { Core } from "../../Core/types/Core";
import { WrapletDependencyMap } from "./WrapletDependencyMap";

export type CoreDependentWrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  core: Core<N, M>;
  wraplet: Wraplet<N>;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
};
