import { destroyWrapletsRecursively } from "./utils";
import { NodeTreeManager } from "./types/NodeTreeManager";
import { createLifecycleAsyncError } from "../utils/createLifecycleAsyncError";

export type Initializer<CONTEXT> = (
  node: Node,
  context?: CONTEXT,
) => Promise<void>;

export class DefaultNodeTreeManager<
  CONTEXT = unknown,
> implements NodeTreeManager<CONTEXT> {
  private initializers: Initializer<CONTEXT>[] = [];

  public addNodeInitializer(callback: Initializer<CONTEXT>): void {
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
