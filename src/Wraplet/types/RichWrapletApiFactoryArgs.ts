import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { GroupExtractor } from "../../types/Groupable";
import { WrapletApiFactoryArgs } from "./WrapletApiFactoryArgs";

export type RichWrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  groupExtractor?: GroupExtractor;
} & WrapletApiFactoryArgs<N, M>;
