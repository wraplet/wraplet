import { DestroyListener } from "./DestroyListener";
import { is } from "./Utils";

const WrapletSymbol = Symbol("Wraplet");
export { WrapletSymbol };

export interface Wraplet<N extends Node = Node> {
  [WrapletSymbol]: true;
  isInitialized: boolean;
  isDestroyed(completely: boolean): boolean;
  accessNode(callback: (node: N) => void): void;
  destroy(): void;
  addDestroyListener(callback: DestroyListener<N>): void;
}

export function isWraplet<N extends Node>(
  object: unknown,
): object is Wraplet<N> {
  return is(object, WrapletSymbol);
}
