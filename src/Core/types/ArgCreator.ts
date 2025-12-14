import { WrapletCreatorArgs } from "./WrapletCreator";
import { WrapletChildrenMap } from "./WrapletChildrenMap";

import { is } from "../../utils/is";

const ArgCreatorSymbol = Symbol("ArgCreator");
export { ArgCreatorSymbol };

export interface ArgCreator<N extends Node, M extends WrapletChildrenMap = {}> {
  [ArgCreatorSymbol]: true;
  createArg(args: WrapletCreatorArgs<N, M>): unknown;
}

export function isArgCreator<N extends Node, M extends WrapletChildrenMap = {}>(
  object: unknown,
): object is ArgCreator<N, M> {
  return is(object, ArgCreatorSymbol);
}
