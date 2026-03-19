import {
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";
import { fillMapWithDefaults } from "./utils";

const MapTreeBuilderSymbol = Symbol("MapTreeBuilder");

export class MapTreeBuilder<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> {
  [MapTreeBuilderSymbol]: true = true;
  private map?: WrapletDependencyMapWithDefaults<M>;
  private children: Partial<Record<keyof M, MapTreeBuilder>> = {};
  constructor(private parent?: MapTreeBuilder) {}

  public getParent(): MapTreeBuilder {
    if (!this.parent) {
      throw new Error("Parent not found.");
    }
    return this.parent;
  }

  public createChild<CM extends WrapletDependencyMap>(
    name: keyof M,
  ): MapTreeBuilder<CM> {
    const mapBuilder = new MapTreeBuilder<CM>(this);
    this.children[name] = mapBuilder;

    return mapBuilder;
  }

  public setMap(map: M): void {
    this.map = fillMapWithDefaults(map);
  }

  public getMap(): WrapletDependencyMapWithDefaults<M> {
    if (!this.map) {
      throw new Error("Map is not set.");
    }
    return this.map;
  }
}

export function isMapTreeBuilder(object: unknown): object is MapTreeBuilder {
  return (
    typeof object === "object" &&
    object !== null &&
    MapTreeBuilderSymbol in object
  );
}
