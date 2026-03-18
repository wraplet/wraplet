import { Initializer } from "../DefaultNodeTreeManager";

export interface NodeTreeManager<CONTEXT = unknown> {
  addNodeInitializer(callback: Initializer<CONTEXT>): void;
  initializeNode(node: Node, context?: CONTEXT): Promise<void>;
  destroyNode(node: Node): Promise<void>;
}
