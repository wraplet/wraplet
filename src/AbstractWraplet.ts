import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { WrapletChildren } from "./types/WrapletChildren";
import { Wraplet, WrapletSymbol } from "./types/Wraplet";
import { DefaultChildrenManager } from "./DefaultChildrenManager";
import { DestroyListener } from "./types/DestroyListener";
import { ChildInstance } from "./types/ChildInstance";
import { CoreInitOptions } from "./types/CoreInitOptions";
import {
  defaultGroupableAttribute,
  Groupable,
  GroupableSymbol,
  GroupExtractor,
} from "./types/Groupable";
import { NodeTreeParent, NodeTreeParentSymbol } from "./types/NodeTreeParent";
import { ChildrenManager } from "./types/ChildrenManager";
import { addWrapletToNode, removeWrapletFromNode } from "./utils";
import { isWrapletSet } from "./types/Set/WrapletSet";

export abstract class AbstractWraplet<
    M extends WrapletChildrenMap = {},
    N extends Node = Node,
  >
  implements Wraplet<N>, Groupable, NodeTreeParent
{
  public [WrapletSymbol]: true = true;
  public [GroupableSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;

  protected childrenManager: ChildrenManager<M, N>;
  private groupsExtractor: GroupExtractor = (node: Node) => {
    if (node instanceof Element) {
      const groupsString = node.getAttribute(defaultGroupableAttribute);
      if (groupsString) {
        return groupsString.split(",");
      }
    }

    return [];
  };
  private destroyListeners: DestroyListener<N>[] = [];

  /**
   * This is the log of all node accessors, available for easier debugging.
   */
  private __debugNodeAccessors: ((element: N) => void)[] = [];

  constructor(
    protected node: N,
    initOptions: Partial<CoreInitOptions<M>> = {},
  ) {
    if (!node) {
      throw new Error("Node is required to create a wraplet.");
    }
    const map = this.defineChildrenMap();

    initOptions.instantiateChildListeners = [
      this.onChildInstantiated.bind(this),
    ];
    initOptions.destroyChildListeners = [this.onChildDestroyed.bind(this)];

    this.childrenManager = new DefaultChildrenManager(node, map, initOptions);
    this.initialize();
  }

  public getNodeTreeChildren(): Wraplet[] {
    const children: Wraplet[] = [];
    for (const child of Object.values(this.children)) {
      if (isWrapletSet(child)) {
        for (const item of child) {
          children.push(item);
        }
      } else {
        children.push(child);
      }
    }

    // Return only descendants.
    return children.filter((child) => {
      let result = false;
      child.accessNode((childsNode) => {
        result = this.node.contains(childsNode);
      });
      return result;
    });
  }

  public setGroupsExtractor(callback: GroupExtractor): void {
    this.groupsExtractor = callback;
  }

  public getGroups(): string[] {
    return this.groupsExtractor(this.node);
  }

  protected get children(): WrapletChildren<M> {
    return this.childrenManager.children;
  }

  public accessNode(callback: (node: N) => void) {
    this.__debugNodeAccessors.push(callback);
    callback(this.node);
  }

  public destroy() {
    for (const listener of this.destroyListeners) {
      listener(this);
    }
    this.destroyListeners.length = 0;
    removeWrapletFromNode(this, this.node);
    this.childrenManager.destroy();
  }

  public isDestroyed(completely: boolean = false): boolean {
    return completely
      ? this.childrenManager.isDestroyed
      : this.childrenManager.isGettingDestroyed ||
          this.childrenManager.isDestroyed;
  }

  public get isInitialized(): boolean {
    return this.childrenManager.isInitialized;
  }

  public addDestroyListener(callback: DestroyListener<N>): void {
    this.destroyListeners.push(callback);
  }

  /**
   * This method will be ivoked if one of the wraplet's children has been destroyed.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onChildDestroyed(child: ChildInstance<M, keyof M>, id: keyof M) {}

  protected initialize(): void {
    this.childrenManager.init();
    addWrapletToNode(this, this.node);
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
      item instanceof this.childrenManager.map[actualUnknownId]["Class"]
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
    if (this === AbstractWraplet) {
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
