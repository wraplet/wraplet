import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../../types/WrapletChildrenMap";
import { is } from "../../types/Utils";
import { MapWrapper } from "../MapWrapper";

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
