import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "./types/WrapletChildDefinition";
import {
  isWrapletChildrenMapWithDefaults,
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "./types/WrapletChildrenMap";

export function addDefaultsToChildDefinition<
  M extends WrapletChildrenMap,
  T extends WrapletChildDefinition<M>,
>(definition: T): WrapletChildDefinitionWithDefaults<T, M> {
  return {
    ...{
      args: [],
      destructible: true,
      map: {},
      coreOptions: {},
    },
    ...definition,
  };
}

export function fillMapWithDefaults<M extends WrapletChildrenMap>(
  map: M,
): WrapletChildrenMapWithDefaults<M> {
  const newMap: Partial<WrapletChildrenMapWithDefaults> = {};
  for (const id in map) {
    const def = map[id];
    newMap[id] = addDefaultsToChildDefinition(def);

    const subMap = def["map"];
    if (subMap && isWrapletChildrenMapWithDefaults(subMap)) {
      newMap[id]["map"] = fillMapWithDefaults(subMap);
    }
  }
  return newMap as WrapletChildrenMapWithDefaults<M>;
}
