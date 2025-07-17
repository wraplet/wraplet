import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { WrapletChildren } from "./types/WrapletChildren";
import { Wraplet } from "./types/Wraplet";
import { Core } from "./Core";
import { DestroyListener } from "./types/DestroyListener";
import { ChildInstance } from "./types/ChildInstance";
import { CoreInitOptions } from "./types/CoreInitOptions";

export type CommonMethods = {
  destroy: {};
};

export abstract class AbstractWraplet<
  M extends WrapletChildrenMap = {},
  N extends Node = Node,
  CM extends CommonMethods = CommonMethods,
> implements Wraplet<N>
{
  public isWraplet: true = true;
  protected core: Core<M, N, CM>;

  constructor(node: N, initOptions: Partial<CoreInitOptions<M>> = {}) {
    if (!node) {
      throw new Error("Node is required to create a wraplet.");
    }
    const map = this.defineChildrenMap();

    initOptions.instantiateChildListeners = [
      this.onChildInstantiated.bind(this),
    ];
    initOptions.destroyChildListeners = [this.onChildDestroyed.bind(this)];

    this.core = new Core(node, map, this, initOptions);
    this.initialize();
  }

  protected get node(): N {
    return this.core.node;
  }

  protected get children(): WrapletChildren<M> {
    return this.core.children;
  }

  public accessNode(callback: (node: N) => void) {
    this.core.accessNode(callback);
  }

  public destroy() {
    this.core.destroy();
  }

  public get isDestroyed(): boolean {
    return this.core.isDestroyed;
  }

  public get isInitialized(): boolean {
    return this.core.isInitialized;
  }

  public addDestroyListener(callback: DestroyListener<N>): void {
    this.core.addDestroyListener(callback);
  }

  /**
   * This method will be ivoked if one of the wraplet's children has been destroyed.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onChildDestroyed(child: ChildInstance<M, keyof M>, id: keyof M) {}

  protected initialize(): void {
    this.core.init();
  }

  /**
   * This method will be ivoked if one of the wraplet's children has been instantiated.
   */
  protected onChildInstantiated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    child: ChildInstance<M, keyof M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: keyof M,
  ) {}

  /**
   * This method makes sure that the given instance is an instance of a class belonging to the
   * given child.
   *
   * @param item
   * @param actualUnknownId
   * @param onlyId
   *   By hardcoding onlyId you can filter out any other children. It allows you to learn not only
   *   that the class is correct, but also that the child is correct (in case multiple children can
   *   use the same class).
   * @protected
   */
  protected isChildInstance<K extends keyof M>(
    item: ChildInstance<M, keyof M>,
    actualUnknownId: keyof M,
    onlyId: K | null = null,
  ): item is ChildInstance<M, K> {
    return (
      actualUnknownId === (onlyId || actualUnknownId) &&
      item instanceof this.core.map[actualUnknownId]["Class"]
    );
  }

  protected abstract defineChildrenMap(): M;

  // We can afford "any" here because this method is only for the external usage, and external
  // callers don't need to know what map is the current wraplet using, as it's its internal
  // matter.
  protected static createWraplets<
    N extends Node,
    T extends AbstractWraplet<any, N> = never,
  >(node: ParentNode, selector: string, additional_args: unknown[] = []): T[] {
    if (this instanceof AbstractWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    let searchNode = node.parentNode;
    // We use a temporary parent to be able to match the top element with the "querySelectorAll"
    // method.
    let tempParent = null;
    if (!searchNode) {
      if (node instanceof Document) {
        searchNode = node;
      } else {
        tempParent = document.createElement("div");
        tempParent.appendChild(node);
        searchNode = tempParent;
      }
    }

    const result: T[] = [];
    const foundElements = searchNode.querySelectorAll(selector);
    if (tempParent) {
      tempParent.removeChild(node);
    }

    for (const element of foundElements) {
      result.push(new (this as any)(element, ...additional_args));
    }

    return result;
  }
}
