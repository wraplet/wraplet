import { addWrapletToNode, destroyWrapletsRecursively } from "../utils";
import { NodeTreeManager } from "./NodeTreeManager";
import { Wraplet } from "../types/Wraplet";
import { WrapletSet } from "../types/Set/WrapletSet";
import { WrapletSetReadonly } from "../types/Set/WrapletSetReadonly";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import { isNodeTreeParent } from "../types/NodeTreeParent";

export type Initializer = (node: Node) => Wraplet[];

export default class DefaultNodeTreeManager implements NodeTreeManager {
  private initializers: Initializer[] = [];
  private items: WrapletSet = new DefaultWrapletSet();

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public initializeNodeTree(node: Node): void {
    for (const initializer of this.initializers) {
      const wraplets = initializer(node);
      for (const wraplet of wraplets) {
        wraplet.accessNode((wrapletsNode) => {
          addWrapletToNode(wraplet, wrapletsNode);
        });
        this.items.add(wraplet);
        if (isNodeTreeParent(wraplet)) {
          const children = wraplet.getNodeTreeChildren();
          for (const child of children) {
            child.accessNode((childNode) => {
              addWrapletToNode(child, childNode);
            });
            this.items.add(child);
          }
        }
        wraplet.addDestroyListener((wraplet) => {
          this.items.delete(wraplet);
        });
      }
    }
  }

  public destroyNodeTree(node: Node): void {
    destroyWrapletsRecursively(node);
  }

  public getSet(): WrapletSetReadonly {
    return this.items as unknown as WrapletSetReadonly;
  }
}
