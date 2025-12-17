import { DestroyListener } from "./DestroyListener";

import { is } from "../../utils/is";

const WrapletSymbol = Symbol("Wraplet");
export { WrapletSymbol };

export interface Wraplet<N extends Node = Node> {
  [WrapletSymbol]: true;
  wraplet: WrapletApi<N>;
}

export interface WrapletApi<N extends Node = Node> {
  isInitialized: boolean;
  isGettingInitialized: boolean;
  isDestroyed: boolean;
  isGettingDestroyed: boolean;
  accessNode(callback: (node: N) => void): void;
  destroy(): Promise<void>;
  initialize(): Promise<void>;
  addDestroyListener(callback: DestroyListener<N>): void;
}

export function isWraplet<N extends Node>(
  object: unknown,
): object is Wraplet<N> {
  return is(object, WrapletSymbol);
}
