import { Wraplet } from "./Wraplet";
import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { CoreInitOptions } from "./CoreInitOptions";

export type SelectorCallback<N extends ParentNode = ParentNode> = (
  node: N,
) => Node[];

export type WrapletChildDefinition<
  M extends WrapletChildrenMap = WrapletChildrenMap,
> = {
  selector?: string | SelectorCallback;
  Class: { new (...args: any[]): Wraplet<any> };
  map?: M;
  coreOptions?: CoreInitOptions<M>;
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};

export type WrapletChildDefinitionWithDefaults<
  T extends WrapletChildDefinition,
  M extends WrapletChildrenMap = WrapletChildrenMap,
> = T & {
  args: unknown[];
  destructible: boolean;
  map: M;
  coreOptions: CoreInitOptions<M>;
};
