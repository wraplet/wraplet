import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "./WrapletChildDefinition";

export type WrapletChildrenMap = {
  [id: string]: WrapletChildDefinition;
};

export type WrapletChildrenMapWithDefaults<
  M extends WrapletChildrenMap = WrapletChildrenMap,
> = {
  [key in keyof M]: WrapletChildDefinitionWithDefaults<M[key]>;
};

export function isWrapletChildrenMapWithDefaults(
  object: unknown,
): object is WrapletChildrenMapWithDefaults {
  return Object.getPrototypeOf(object) === Object.prototype;
}
