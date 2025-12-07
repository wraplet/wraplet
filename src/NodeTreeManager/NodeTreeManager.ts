import { Initializer } from "./DefaultNodeTreeManager";
import { WrapletSetReadonly } from "../types/Set/WrapletSetReadonly";

export interface NodeTreeManager {
  addWrapletInitializer(callback: Initializer): void;
  initializeNodeTree(node: Node): Promise<void>;
  destroyNodeTree(node: Node): Promise<void>;
  getSet(): WrapletSetReadonly;
}
