export interface Wraplet<N extends Node = Node> {
  isWraplet: true;
  accessNode(callback: (node: N) => void): void;
  destroy(): void;
}
