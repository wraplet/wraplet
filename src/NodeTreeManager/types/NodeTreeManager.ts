import { Initializer } from "../DefaultNodeTreeManager";
import { WrapletSetReadonly } from "../../Set/types/WrapletSetReadonly";

export interface NodeTreeManager {
  addWrapletInitializer(callback: Initializer): void;
  initializeNodeTree(node: Node): Promise<void>;
  destroyNodeTree(node: Node): Promise<void>;
  getSet(): WrapletSetReadonly;
}
