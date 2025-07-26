import { Initializer } from "../NodeTreeManager/DefaultNodeTreeManager";

export interface NodeTreeManager {
  addWrapletInitializer(callback: Initializer): void;
  initializeNodeTree(node: Node): void;
  destroyNodeTree(node: Node): void;
}
