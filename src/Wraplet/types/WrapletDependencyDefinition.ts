import { Wraplet } from "./Wraplet";
import { Constructable } from "../../utils/types/Utils";
import { Injector } from "../../Injector/types/Injector";

export type SelectorCallback<N extends ParentNode = ParentNode> = (
  node: N,
) => Node[];

export type WrapletDependencyDefinition = {
  selector?: string | SelectorCallback;
  Class: Constructable<Wraplet<any>>;
  injector?: Injector;
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};

export type WrapletDependencyDefinitionWithDefaults<
  T extends WrapletDependencyDefinition = WrapletDependencyDefinition,
> = T & {
  args: unknown[];
  destructible: boolean;
  injector: Injector;
};
