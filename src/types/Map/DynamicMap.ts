import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../WrapletChildrenMap";
import { is } from "../Utils";
import { MapWrapper } from "../../Map/MapWrapper";

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
