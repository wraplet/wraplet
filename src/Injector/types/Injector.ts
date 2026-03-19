import { MapTreeBuilder } from "../../Map/MapTreeBuilder";
import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";

export type Injector<
  N extends Node = Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
  D = any,
> = {
  data?: D;
  callback: (node: N, map: MapTreeBuilder<M>, data?: D) => unknown;
};
