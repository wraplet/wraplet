import { Wraplet } from "./Wraplet";

export type SelectorCallback<N extends ParentNode = ParentNode> = (
  node: N,
) => Node[];

export type WrapletChildDefinition = {
  selector?: string | SelectorCallback;
  Class: { new (...args: any[]): Wraplet<any> };
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};

export type WrapletChildDefinitionWithDefaults<
  T extends WrapletChildDefinition,
> = T & { args: unknown[]; destructible: boolean };
