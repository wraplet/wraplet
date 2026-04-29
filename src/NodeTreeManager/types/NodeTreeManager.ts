import { NodeInitializer } from "./NodeInitializer";

export interface NodeTreeManager<CONTEXT = unknown> {
  addNodeInitializer(callback: NodeInitializer<CONTEXT>): void;
  initializeNode(node: Node, context?: CONTEXT): Promise<void>;
  destroyNode(node: Node): Promise<void>;
}
