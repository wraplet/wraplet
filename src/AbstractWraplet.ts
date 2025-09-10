import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { WrapletChildren } from "./types/WrapletChildren";
import { Wraplet, WrapletSymbol } from "./types/Wraplet";
import { DestroyListener } from "./types/DestroyListener";
import { ChildInstance } from "./types/ChildInstance";
import {
  defaultGroupableAttribute,
  Groupable,
  GroupableSymbol,
  GroupExtractor,
} from "./types/Groupable";
import { NodeTreeParent, NodeTreeParentSymbol } from "./types/NodeTreeParent";
import { Core, isCore } from "./types/Core";
import { isWrapletSet } from "./types/Set/WrapletSet";
import { DefaultCore } from "./DefaultCore";

export abstract class AbstractWraplet<
    M extends WrapletChildrenMap = {},
    N extends Node = Node,
  >
  implements Wraplet<N>, Groupable, NodeTreeParent
{
  public [WrapletSymbol]: true = true;
  public [GroupableSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;

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

  constructor(protected core: Core<M, N>) {
    if (!isCore(core)) {
      throw new Error("AbstractWraplet requires a Core instance.");
    }

    core.addDestroyChildListener(this.onChildDestroyed.bind(this));
    core.addInstantiateChildListener(this.onChildInstantiated.bind(this));

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
    return this.core.children;
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
    this.core.destroy();
  }

  public isDestroyed(completely: boolean = false): boolean {
    return completely
      ? this.core.isDestroyed
      : this.core.isGettingDestroyed || this.core.isDestroyed;
  }

  public isInitialized(): boolean {
    return this.core.isInitialized;
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
    this.core.init();
  }

  protected get node(): N {
    return this.core.node;
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

  protected static createCore<N extends Node, M extends WrapletChildrenMap>(
    node: N,
    map: M,
  ): Core<M, N> {
    return new DefaultCore(node, map);
  }

  // We can afford "any" here because this method is only for the external usage, and external
  // callers don't need to know what map is the current wraplet using, as it's its internal
  // matter.
  protected static createWraplets<
    N extends Node,
    T extends AbstractWraplet<any, N> = never,
  >(
    node: ParentNode,
    map: WrapletChildrenMap,
    attribute: string,
    additional_args: unknown[] = [],
  ): T[] {
    if (this === AbstractWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const result: T[] = [];

    if (node instanceof Element && node.hasAttribute(attribute)) {
      const core = AbstractWraplet.createCore(node, map);
      result.push(new (this as any)(core, ...additional_args));
    }

    const foundElements = node.querySelectorAll(`[${attribute}]`);
    for (const element of foundElements) {
      const core = AbstractWraplet.createCore(element, map);
      result.push(new (this as any)(core, ...additional_args));
    }

    return result;
  }
}
