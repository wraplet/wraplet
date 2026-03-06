import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { Core } from "../../Core/types/Core";
import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryBasicCallback";
import { Wraplet } from "./Wraplet";

export type WrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  core: Core<N, M>;
  wraplet: Wraplet<N>;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
  /**
   * This overrides the whole "initialize" callback, with the lifecycle logic and all.
   * Don't override it unless you know what you're doing.
   */
  initializeOuterCallback?: WrapletApiFactoryBasicCallback;

  /**
   * This overrides the whole "destroy" callback, with the lifecycle logic and all.
   * Don't override it unless you know what you're doing.
   */
  destroyOuterCallback?: WrapletApiFactoryBasicCallback;
};
