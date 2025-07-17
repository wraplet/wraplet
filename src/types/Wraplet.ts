import { DestroyListener } from "./DestroyListener";

export interface Wraplet<N extends Node = Node> {
  isWraplet: true;
  isDestroyed: boolean;
  isInitialized: boolean;
  accessNode(callback: (node: N) => void): void;
  destroy(): void;
  addDestroyListener(callback: DestroyListener<N>): void;
}
