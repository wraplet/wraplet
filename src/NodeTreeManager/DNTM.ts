import { destroyWrapletsRecursively } from "./utils";
import { NodeTreeManager } from "./types/NodeTreeManager";
import { createLifecycleAsyncError } from "../utils/createLifecycleAsyncError";
import { NodeInitializer } from "./types/NodeInitializer";

export class DNTM<CONTEXT = unknown> implements NodeTreeManager<CONTEXT> {
  private initializers: NodeInitializer<CONTEXT>[] = [];

  public addNodeInitializer(callback: NodeInitializer<CONTEXT>): void {
    this.initializers.push(callback);
  }

  public async initializeNode(node: Node, context?: CONTEXT): Promise<void> {
    const results = await Promise.allSettled(
      this.initializers.map((initializer) => initializer(node, context)),
    );

    createLifecycleAsyncError(
      `There were errors during the node's initialization.`,
      results,
    );
  }

  public async destroyNode(node: Node): Promise<void> {
    await destroyWrapletsRecursively(node);
  }
}
