import { MapWrapper } from "./MapWrapper";
import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../types/WrapletChildrenMap";
import { DynamicMap, DynamicMapSymbol } from "../types/Map/DynamicMap";

export class MapRepeat implements DynamicMap {
  [DynamicMapSymbol]: true = true;

  constructor(private readonly levels: number = 1) {
    if (levels < 1) {
      throw new Error("There have to be more than 0 repeated levels.");
    }
  }

  public create<M extends WrapletChildrenMap>(
    parentMapClone: MapWrapper<M>,
  ): WrapletChildrenMapWithDefaults {
    for (let i = 0; i < this.levels; i++) {
      parentMapClone.down();
    }

    return parentMapClone.getCurrentMap();
  }

  public static create(levels: number = 1): MapRepeat {
    return new MapRepeat(levels);
  }
}
