import {
  WrapletDependencyDefinition,
  WrapletDependencyDefinitionWithDefaults,
} from "../Wraplet/types/WrapletDependencyDefinition";
import {
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";

export function addDefaultsToDependencyDefinition<
  T extends WrapletDependencyDefinition,
>(definition: T): WrapletDependencyDefinitionWithDefaults<T> {
  return {
    ...({
      args: [],
      destructible: true,
      injector: {
        callback: (node: Node) => node,
      },
    } satisfies Partial<WrapletDependencyDefinition>),
    ...definition,
  };
}

export function fillMapWithDefaults<M extends WrapletDependencyMap>(
  map: M,
): WrapletDependencyMapWithDefaults<M> {
  const newMap: Partial<WrapletDependencyMapWithDefaults> = {};
  for (const id of Object.keys(map)) {
    const def = map[id];
    newMap[id] = addDefaultsToDependencyDefinition(def);
  }
  return newMap as WrapletDependencyMapWithDefaults<M>;
}
