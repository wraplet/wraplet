import { destroyWrapletsRecursively } from "../utils";
import { NodeTreeManager } from "./NodeTreeManager";
import { Wraplet } from "../types/Wraplet";
import { isWrapletSet, WrapletSet } from "../Set/WrapletSet";
import { WrapletSetReadonly } from "../Set/WrapletSetReadonly";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import { isNodeTreeParent } from "../types/NodeTreeParent";

export type Initializer = (node: Node) => Wraplet[];

export default class DefaultNodeTreeManager implements NodeTreeManager {
  private initializers: Initializer[] = [];

  constructor(private items: WrapletSet = new DefaultWrapletSet()) {
    if (!isWrapletSet(items)) {
      throw new TypeError("'items' must be an instance of 'WrapletSet'");
    }
  }

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public initializeNodeTree(node: Node): void {
    for (const initializer of this.initializers) {
      const wraplets = initializer(node);
      for (const wraplet of wraplets) {
        this.items.add(wraplet);
        if (isNodeTreeParent(wraplet)) {
          const children = wraplet.getNodeTreeChildren();
          for (const child of children) {
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
