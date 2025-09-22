import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "./types/WrapletChildDefinition";
import {
  isWrapletChildrenMapWithDefaults,
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "./types/WrapletChildrenMap";

export function addDefaultsToChildDefinition<T extends WrapletChildDefinition>(
  definition: T,
): WrapletChildDefinitionWithDefaults<T> {
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

export function fillMapWithDefaults<T extends WrapletChildrenMap>(
  map: T,
): WrapletChildrenMapWithDefaults<T> {
  const newMap: Partial<WrapletChildrenMapWithDefaults<T>> = {};
  for (const id in map) {
    newMap[id] = addDefaultsToChildDefinition(map[id]);
    const subMap = map[id]["map"];
    if (subMap && isWrapletChildrenMapWithDefaults(subMap)) {
      newMap[id]["map"] = fillMapWithDefaults(subMap);
    }
  }
  return newMap as WrapletChildrenMapWithDefaults<T>;
}
