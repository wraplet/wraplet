import { destroyWrapletsRecursively } from "../utils";
import { NodeTreeManager } from "./NodeTreeManager";
import { Wraplet } from "../types/Wraplet";
import {
  isWrapletCollection,
  WrapletCollection,
} from "../Collection/WrapletCollection";
import { WrapletCollectionReadonly } from "../Collection/WrapletCollectionReadonly";
import { DefaultWrapletCollection } from "../Collection/DefaultWrapletCollection";
import {isNodeTreeParent} from "../types/NodeTreeParent";

export type Initializer = (node: Node) => Wraplet[];

export default class DefaultNodeTreeManager implements NodeTreeManager {
  private initializers: Initializer[] = [];

  constructor(
    private collection: WrapletCollection = new DefaultWrapletCollection(),
  ) {
    if (!isWrapletCollection(collection)) {
      throw new TypeError(
        "'collection' must be an instance of 'WrapletCollection'",
      );
    }
  }

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public initializeNodeTree(node: Node): void {
    for (const initializer of this.initializers) {
      const wraplets = initializer(node);
      for (const wraplet of wraplets) {
        this.collection.add(wraplet);
        if (isNodeTreeParent(wraplet)) {
          const children = wraplet.getNodeTreeChildren();
          for (const child of children) {
            this.collection.add(child);
          }
        }
        wraplet.addDestroyListener((wraplet) => {
          this.collection.delete(wraplet);
        });
      }
    }
  }

  public destroyNodeTree(node: Node): void {
    destroyWrapletsRecursively(node);
  }

  public getCollection(): WrapletCollectionReadonly {
    return this.collection;
  }
}
