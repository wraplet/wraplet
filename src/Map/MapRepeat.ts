import { MapWrapper } from "./MapWrapper";
import {
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";
import { DynamicMap, DynamicMapSymbol } from "./types/DynamicMap";

export class MapRepeat implements DynamicMap {
  [DynamicMapSymbol]: true = true;

  constructor(private readonly levels: number = 1) {
    if (levels < 1) {
      throw new Error("There have to be more than 0 repeated levels.");
    }
  }

  public create<M extends WrapletDependencyMap>(
    parentMapClone: MapWrapper<M>,
  ): WrapletDependencyMapWithDefaults<M> {
    for (let i = 0; i < this.levels; i++) {
      parentMapClone.down();
    }

    return parentMapClone.getCurrentMap();
  }

  public static create(levels: number = 1): MapRepeat {
    return new MapRepeat(levels);
  }
}
