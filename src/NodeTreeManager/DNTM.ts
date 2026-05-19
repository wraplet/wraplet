import { destroyWrapletsRecursively } from "./utils";
import { NodeTreeManager } from "./types/NodeTreeManager";
import { NodeInitializer } from "./types/NodeInitializer";

export class DNTM<CONTEXT = unknown> implements NodeTreeManager<CONTEXT> {
  private initializers: NodeInitializer<CONTEXT>[] = [];

  public addNodeInitializer(callback: NodeInitializer<CONTEXT>): void {
    this.initializers.push(callback);
  }

  public async initializeNode(node: Node, context?: CONTEXT): Promise<void> {
    const errors: unknown[] = [];

    await Promise.all(
      this.initializers.map(async (initializer) => {
        try {
          await initializer(node, context);
        } catch (error) {
          errors.push(error);
        }
      }),
    );

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `There were errors during the node's initialization.`,
      );
    }
  }

  public async destroyNode(node: Node): Promise<void> {
    await destroyWrapletsRecursively(node);
  }
}
