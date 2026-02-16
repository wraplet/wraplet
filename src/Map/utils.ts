import {
  WrapletDependencyDefinition,
  WrapletDependencyDefinitionWithDefaults,
} from "../Wraplet/types/WrapletDependencyDefinition";
import {
  isWrapletDependencyMap,
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";

export function addDefaultsToDependencyDefinition<
  M extends WrapletDependencyMap,
  T extends WrapletDependencyDefinition<M>,
>(definition: T): WrapletDependencyDefinitionWithDefaults<T, M> {
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

export function fillMapWithDefaults<M extends WrapletDependencyMap>(
  map: M,
): WrapletDependencyMapWithDefaults<M> {
  const newMap: Partial<WrapletDependencyMapWithDefaults> = {};
  for (const id in map) {
    const def = map[id];
    newMap[id] = addDefaultsToDependencyDefinition(def);

    const subMap = def["map"];
    if (subMap && isWrapletDependencyMap(subMap)) {
      newMap[id]["map"] = fillMapWithDefaults(subMap);
    }
  }
  return newMap as WrapletDependencyMapWithDefaults<M>;
}
