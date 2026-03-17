import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { WrapletApiFactoryArgs } from "./WrapletApiFactoryArgs";
import { Core } from "../../Core/types/Core";

export type RichWrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  core: Core<N, M>;
} & Omit<WrapletApiFactoryArgs<N>, "node_or_core">;
