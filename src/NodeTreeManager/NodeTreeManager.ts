import { Initializer } from "./DefaultNodeTreeManager";
import { WrapletSetReadonly } from "../types/Set/WrapletSetReadonly";

export interface NodeTreeManager {
  addWrapletInitializer(callback: Initializer): void;
  initializeNodeTree(node: Node): void;
  destroyNodeTree(node: Node): void;
  getSet(): WrapletSetReadonly;
}
