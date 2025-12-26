import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { GroupExtractor } from "../../types/Groupable";
import { WrapletApiFactoryArgs } from "./WrapletApiFactoryArgs";

export type RichWrapletApiFactoryArgs<
  N extends Node = Node,
  M extends WrapletChildrenMap = WrapletChildrenMap,
> = {
  groupExtractor?: GroupExtractor;
} & WrapletApiFactoryArgs<N, M>;
