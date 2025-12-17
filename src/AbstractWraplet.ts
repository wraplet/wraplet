import { WrapletChildrenMap } from "./Core/types/WrapletChildrenMap";
import { WrapletChildren } from "./Core/types/WrapletChildren";
import { Wraplet, WrapletApi, WrapletSymbol } from "./Core/types/Wraplet";
import { DestroyListener } from "./Core/types/DestroyListener";
import { ChildInstance } from "./Core/types/ChildInstance";
import {
  defaultGroupableAttribute,
  Groupable,
  GroupableSymbol,
  GroupExtractor,
} from "./types/Groupable";
import {
  NodeTreeParent,
  NodeTreeParentSymbol,
} from "./Core/types/NodeTreeParent";
import { Core, isCore } from "./Core/types/Core";
import { DefaultCore } from "./Core/DefaultCore";

export abstract class AbstractWraplet<
  N extends Node = Node,
  M extends WrapletChildrenMap = {},
>
  implements Wraplet<N>, Groupable, NodeTreeParent
{
  public [WrapletSymbol]: true = true;
  public [GroupableSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;

  protected isGettingDestroyed: boolean = false;
  protected isDestroyed: boolean = false;
  protected isGettingInitialized: boolean = false;
  protected isInitialized: boolean = false;

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

  constructor(protected core: Core<N, M>) {
    if (!isCore(core)) {
      throw new Error("AbstractWraplet requires a Core instance.");
    }

    core.addDestroyChildListener(this.onChildDestroy.bind(this));
    core.addInstantiateChildListener(this.onChildInstantiate.bind(this));
  }

  public get wraplet(): WrapletApi<N> &
    NodeTreeParent["wraplet"] &
    Groupable["wraplet"] {
    return {
      isGettingInitialized: this.isGettingInitialized,
      isInitialized: this.isInitialized,
      isGettingDestroyed: this.isGettingDestroyed,
      isDestroyed: this.isDestroyed,

      addDestroyListener: (callback: DestroyListener<N>) => {
        this.destroyListeners.push(callback);
      },

      initialize: this.initialize.bind(this),

      destroy: this.destroy.bind(this),

      accessNode: (callback: (node: N) => void) => {
        this.__debugNodeAccessors.push(callback);
        callback(this.node);
      },

      getNodeTreeChildren: (): Wraplet[] => {
        return this.core.getNodeTreeChildren();
      },

      setGroupsExtractor: this.setGroupsExtractor.bind(this),
      getGroups: this.getGroups.bind(this),
    };
  }

  protected setGroupsExtractor(callback: GroupExtractor): void {
    this.groupsExtractor = callback;
  }

  protected getGroups(): string[] {
    return this.groupsExtractor(this.node);
  }

  protected get children(): WrapletChildren<M> {
    return this.core.children;
  }

  protected async destroy() {
    if (this.isDestroyed) {
      // We are already destroyed.
      return;
    }

    this.isGettingDestroyed = true;
    if (this.isGettingInitialized) {
      // If we are still initializing, then postpone destruction until after
      // initialization is finished.
      // We are leaving this method, but with `isGettingDestroyed` set to true, so
      // the initialization process will know to return here after it will finish.
      return;
    }

    if (!this.isInitialized) {
      // If we are not initialized, then we have nothing to do here.
      this.isDestroyed = true;
      this.isGettingDestroyed = false;
      return;
    }

    for (const listener of this.destroyListeners) {
      await listener(this);
    }

    this.destroyListeners.length = 0;

    await this.core.destroy();

    await this.onDestroy();

    this.isDestroyed = true;
    this.isGettingDestroyed = false;
  }

  protected async onDestroy() {}

  /**
   * This method will be ivoked if one of the wraplet's children has been destroyed.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onChildDestroy(child: ChildInstance<M, keyof M>, id: keyof M) {}

  protected async initialize(): Promise<void> {
    this.isGettingInitialized = true;
    await this.core.initialize();
    await this.onInitialize();
    this.isInitialized = true;
    this.isGettingInitialized = false;

    // If destruction has been invoked in the meantime, we can finally do it, when initialization
    // is finished.
    if (this.isGettingDestroyed) {
      await this.destroy();
    }
  }

  protected async onInitialize() {}

  protected get node(): N {
    return this.core.node;
  }

  /**
   * This method will be invoked if one of the wraplet's children has been instantiated.
   */
  protected onChildInstantiate(
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
  ): Core<N, M> {
    return new DefaultCore(node, map);
  }

  // We can afford "any" here because this method is only for the external usage, and external
  // callers don't need to know what map is the current wraplet using, as it's its internal
  // matter.
  protected static createWraplets<
    N extends Node,
    T extends AbstractWraplet<N, any> = never,
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
      const core = this.createCore(node, map);
      result.push(new (this as any)(core, ...additional_args));
    }

    const foundElements = node.querySelectorAll(`[${attribute}]`);
    for (const element of foundElements) {
      const core = this.createCore(element, map);
      result.push(new (this as any)(core, ...additional_args));
    }

    return result;
  }
}
