import { destroyWrapletsRecursively } from "./utils";
import { NodeTreeManager } from "./types/NodeTreeManager";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { WrapletSet } from "../Set/types/WrapletSet";
import { WrapletSetReadonly } from "../Set/types/WrapletSetReadonly";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import { isNodeTreeParent } from "./types/NodeTreeParent";

export type Initializer = (node: Node) => Promise<Wraplet[]>;

export default class DefaultNodeTreeManager implements NodeTreeManager {
  private initializers: Initializer[] = [];
  private items: WrapletSet = new DefaultWrapletSet();

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public async initializeNodeTree(node: Node): Promise<void> {
    // Run initializers against the given node.
    for (const initializer of this.initializers) {
      const instantiatedWraplets = await initializer(node);
      for (const instantiatedWraplet of instantiatedWraplets) {
        this.items.add(instantiatedWraplet);
        if (isNodeTreeParent(instantiatedWraplet)) {
          const nodeTreeWraplets =
            instantiatedWraplet.wraplet.getChildrenDependencies();
          for (const nodeTreeWraplet of nodeTreeWraplets) {
            this.items.add(nodeTreeWraplet);
          }
        }
        instantiatedWraplet.wraplet.addDestroyListener(async (wraplet) => {
          this.items.delete(wraplet);
        });
      }
    }
  }

  public async destroyNodeTree(node: Node): Promise<void> {
    await destroyWrapletsRecursively(node);
  }

  public getSet(): WrapletSetReadonly {
    return this.items as unknown as WrapletSetReadonly;
  }
}
