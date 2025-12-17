import { DestroyListener } from "../../Core/types/DestroyListener";

import { is } from "../../utils/is";

const WrapletSymbol = Symbol("Wraplet");
export { WrapletSymbol };

export interface Wraplet<N extends Node = Node> {
  [WrapletSymbol]: true;
  wraplet: WrapletApi<N>;
}

export interface WrapletApi<N extends Node = Node> {
  status: Status;
  accessNode(callback: (node: N) => void): void;
  destroy(): Promise<void>;
  initialize(): Promise<void>;
  addDestroyListener(callback: DestroyListener<N>): void;
}

export interface Status {
  isInitialized: boolean;
  isGettingInitialized: boolean;
  isDestroyed: boolean;
  isGettingDestroyed: boolean;
}

export function isWraplet<N extends Node>(
  object: unknown,
): object is Wraplet<N> {
  return is(object, WrapletSymbol);
}
