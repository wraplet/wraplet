import { addWrapletToNode, destroyWrapletsRecursively } from "./utils";
import { NodeTreeManager } from "./NodeTreeManager";
import { Wraplet } from "../Core/types/Wraplet";
import { WrapletSet } from "../Set/types/WrapletSet";
import { WrapletSetReadonly } from "../Set/types/WrapletSetReadonly";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import { isNodeTreeParent } from "../Core/types/NodeTreeParent";

export type Initializer = (node: Node) => Promise<Wraplet[]>;

export default class DefaultNodeTreeManager implements NodeTreeManager {
  private initializers: Initializer[] = [];
  private items: WrapletSet = new DefaultWrapletSet();

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public async initializeNodeTree(node: Node): Promise<void> {
    for (const initializer of this.initializers) {
      const wraplets = await initializer(node);
      for (const wraplet of wraplets) {
        wraplet.wraplet.accessNode((wrapletsNode) => {
          addWrapletToNode(wraplet, wrapletsNode);
        });
        this.items.add(wraplet);
        if (isNodeTreeParent(wraplet)) {
          const children = wraplet.wraplet.getNodeTreeChildren();
          for (const child of children) {
            child.wraplet.accessNode((childNode: Node) => {
              addWrapletToNode(child, childNode);
            });
            this.items.add(child);
          }
        }
        wraplet.wraplet.addDestroyListener(async (wraplet) => {
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
