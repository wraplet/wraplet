export interface WrapletManager {
  addWrapletInitializer(callback: (node: Node) => void): void;
  initializeNodeTree(node: Node): void;
  destroyNodeTree(node: Node): void;
}
