import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "./WrapletChildDefinition";

export type WrapletChildrenMap = {
  [id: string]: WrapletChildDefinition;
};

export type WrapletChildrenMapWithDefaults<M extends WrapletChildrenMap> = {
  [key in keyof M]: WrapletChildDefinitionWithDefaults<M[key]>;
};
