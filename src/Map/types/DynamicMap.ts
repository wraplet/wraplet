import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../../Core/types/WrapletChildrenMap";
import { MapWrapper } from "../MapWrapper";
import { is } from "../../utils/is";

const DynamicMapSymbol = Symbol("DynamicMap");
export { DynamicMapSymbol };

export interface DynamicMap {
  [DynamicMapSymbol]: true;
  create<M extends WrapletChildrenMap>(
    parentMapClone: MapWrapper<M>,
  ): WrapletChildrenMapWithDefaults<M>;
}

export function isDynamicMap(object: unknown): object is DynamicMap {
  return is(object, DynamicMapSymbol);
}
