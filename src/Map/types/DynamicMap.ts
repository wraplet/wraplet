import {
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../../Wraplet/types/WrapletDependencyMap";
import { MapWrapper } from "../MapWrapper";
import { is } from "../../utils/is";

const DynamicMapSymbol = Symbol("DynamicMap");
export { DynamicMapSymbol };

export interface DynamicMap {
  [DynamicMapSymbol]: true;
  create<M extends WrapletDependencyMap>(
    parentMapClone: MapWrapper<M>,
  ): WrapletDependencyMapWithDefaults<M>;
}

export function isDynamicMap(object: unknown): object is DynamicMap {
  return is(object, DynamicMapSymbol);
}
