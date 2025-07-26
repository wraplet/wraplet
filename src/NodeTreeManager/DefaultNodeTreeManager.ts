import { destroyWrapletsRecursively, findWrapletsRecursively } from "../utils";
import { NodeTreeManager } from "../types/NodeTreeManager";
import { Wraplet } from "../types/Wraplet";
import { isGroupableGuard } from "../types/Groupable";

export type Initializer = (node: Node) => Wraplet[];

export default class DefaultNodeTreeManager implements NodeTreeManager {
  private wraplets: Set<Wraplet> = new Set();
  private initializers: Initializer[] = [];

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public initializeNodeTree(node: Node): void {
    for (const initializer of this.initializers) {
      const wraplets = initializer(node);
      for (const wraplet of wraplets) {
        this.wraplets.add(wraplet);
        wraplet.addDestroyListener((wraplet) => {
          this.wraplets.delete(wraplet);
        });
      }
    }

    //for (const initializer of this.initializers) {
    //  initializer(node);
    //}
    //const wraplets = findWrapletsRecursively(node);
    //for (const wraplet of wraplets) {
    //  this.wraplets.add(wraplet);
    //  wraplet.addDestroyListener((wraplet) => {
    //    this.wraplets.delete(wraplet);
    //  });
    //}
  }

  public destroyNodeTree(node: Node): void {
    destroyWrapletsRecursively(node);
  }

  public findByGroup(group: string): Wraplet[] {
    const result: Wraplet[] = [];
    for (const wraplet of this.wraplets) {
      if (!isGroupableGuard(wraplet)) {
        continue;
      }

      const groups = wraplet.getGroups();
      if (!groups.includes(group)) {
        continue;
      }

      result.push(wraplet);
    }

    return result;
  }
}
