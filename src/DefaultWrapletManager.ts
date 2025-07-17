import { destroyWrapletsRecursively } from "./utils";
import { WrapletManager } from "./types/WrapletManager";

export type Initializer = (node: Node) => void;

export default class DefaultWrapletManager implements WrapletManager {
  private initializers: Initializer[] = [];

  public addWrapletInitializer(callback: Initializer): void {
    this.initializers.push(callback);
  }

  public initializeNodeTree(node: Node): void {
    for (const initializer of this.initializers) {
      initializer(node);
    }
  }

  public destroyNodeTree(node: Node): void {
    destroyWrapletsRecursively(node);
  }
}
