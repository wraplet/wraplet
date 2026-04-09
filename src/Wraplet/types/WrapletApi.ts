import { is } from "../../utils/is";
import { BaseWrapletApi, DependencyApiDebug } from "./DependencyApi";
import { DestroyListener } from "../../DependencyManager/types/DestroyListener";
import { Wraplet } from "./Wraplet";

export const WrapletApiSymbol = Symbol("WrapletApi");

export interface WrapletApi<N extends Node = Node> extends BaseWrapletApi {
  [WrapletApiSymbol]: true;

  accessNode(callback: (node: N) => void): void;

  addDestroyListener(callback: DestroyListener<Wraplet<N>>): void;
}

export function isWrapletApi<N extends Node>(
  object: unknown,
): object is WrapletApi<N> {
  return is(object, WrapletApiSymbol);
}

export interface WrapletApiDebug<N extends Node> extends DependencyApiDebug {
  __nodeAccessors: ((node: N) => void)[];
}
