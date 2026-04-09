import { is } from "../../utils/is";
import { NodelessWrapletApi } from "./NodelessWrapletApi";
import { WrapletApi } from "./WrapletApi";

export const NodelessWrapletSymbol = Symbol("NodelessWraplet");

export interface NodelessWraplet {
  [NodelessWrapletSymbol]: true;
  wraplet: NodelessWrapletApi;
}

export function isNodelessWraplet(object: unknown): object is NodelessWraplet {
  return is(object, NodelessWrapletSymbol);
}

export const WrapletSymbol = Symbol("Wraplet");

export interface Wraplet<N extends Node = Node> {
  [WrapletSymbol]: true;
  wraplet: WrapletApi<N>;
}

export function isWraplet<N extends Node>(
  object: unknown,
): object is Wraplet<N> {
  return is(object, WrapletSymbol);
}

export function isAnyWraplet(
  object: unknown,
): object is Wraplet | NodelessWraplet {
  return isWraplet(object) || isNodelessWraplet(object);
}

export type Wraplets = Wraplet | NodelessWraplet;
