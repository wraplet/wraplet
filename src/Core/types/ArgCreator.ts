import { WrapletCreatorArgs } from "./WrapletCreator";
import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";

import { is } from "../../utils/is";

const ArgCreatorSymbol = Symbol("ArgCreator");
export { ArgCreatorSymbol };

export interface ArgCreator<
  N extends Node,
  M extends WrapletDependencyMap = {},
> {
  [ArgCreatorSymbol]: true;
  createArg(args: WrapletCreatorArgs<N, M>): unknown;
}

export function isArgCreator<
  N extends Node,
  M extends WrapletDependencyMap = {},
>(object: unknown): object is ArgCreator<N, M> {
  return is(object, ArgCreatorSymbol);
}
