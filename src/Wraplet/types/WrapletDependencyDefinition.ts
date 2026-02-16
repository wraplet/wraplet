import { Wraplet } from "./Wraplet";
import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { CoreInitOptions } from "../../Core/types/CoreInitOptions";
import { DynamicMap } from "../../Map/types/DynamicMap";
import { Constructable } from "../../utils/types/Utils";

export type SelectorCallback<N extends ParentNode = ParentNode> = (
  node: N,
) => Node[];

export type WrapletDependencyDefinition<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  selector?: string | SelectorCallback;
  Class: Constructable<Wraplet<any>>;
  map?: M | DynamicMap;
  coreOptions?: CoreInitOptions<M>;
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};

export type WrapletDependencyDefinitionWithDefaults<
  T extends WrapletDependencyDefinition = WrapletDependencyDefinition,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = T & {
  args: unknown[];
  destructible: boolean;
  map: M | DynamicMap;
  coreOptions: CoreInitOptions<M>;
};
