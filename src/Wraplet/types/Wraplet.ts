import { is } from "../../utils/is";
import { WrapletApi } from "./WrapletApi";

const WrapletSymbol = Symbol("Wraplet");
export { WrapletSymbol };

export interface Wraplet<N extends Node = Node> {
  [WrapletSymbol]: true;
  wraplet: WrapletApi<N>;
}

export function isWraplet<N extends Node>(
  object: unknown,
): object is Wraplet<N> {
  return is(object, WrapletSymbol);
}
