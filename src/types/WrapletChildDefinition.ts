import { Wraplet } from "./Wraplet";

export type WrapletChildDefinition = {
  selector?: string;
  Class: { new (...args: any[]): Wraplet<any> };
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};

export type WrapletChildDefinitionWithDefaults<
  T extends WrapletChildDefinition,
> = T & { args: unknown[]; destructible: boolean };
