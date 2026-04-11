import { Wraplet } from "../../Wraplet/types/Wraplet";
import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { WrapletDependencyDefinitionWithDefaults } from "../../Wraplet/types/WrapletDependencyDefinition";
import { MapTreeBuilder } from "../../Map/MapTreeBuilder";

export type WrapletCreator<N extends Node, M extends WrapletDependencyMap> = (
  node: N,
  definition: WrapletDependencyDefinitionWithDefaults,
  map: MapTreeBuilder<M>,
) => Wraplet;
