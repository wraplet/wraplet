import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "../Wraplet/types/WrapletChildDefinition";
import {
  isWrapletChildrenMap,
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../Wraplet/types/WrapletChildrenMap";

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
    if (subMap && isWrapletChildrenMap(subMap)) {
      newMap[id]["map"] = fillMapWithDefaults(subMap);
    }
  }
  return newMap as WrapletChildrenMapWithDefaults<M>;
}
