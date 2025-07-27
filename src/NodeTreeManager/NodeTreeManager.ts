import { Initializer } from "./DefaultNodeTreeManager";
import { CollectionReadonly } from "../Collection/CollectionReadonly";
import { Wraplet } from "../types/Wraplet";

export interface NodeTreeManager {
  addWrapletInitializer(callback: Initializer): void;
  initializeNodeTree(node: Node): void;
  destroyNodeTree(node: Node): void;
  getCollection(): CollectionReadonly<Wraplet>;
}
