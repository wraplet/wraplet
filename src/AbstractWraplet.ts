import { WrapletChildrenMap } from "./Wraplet/types/WrapletChildrenMap";
import { WrapletChildren } from "./Wraplet/types/WrapletChildren";
import { Wraplet, WrapletSymbol } from "./Wraplet/types/Wraplet";
import { DestroyListener } from "./Core/types/DestroyListener";
import { ChildInstance } from "./Wraplet/types/ChildInstance";
import { Groupable, GroupableSymbol } from "./types/Groupable";
import {
  NodeTreeParent,
  NodeTreeParentSymbol,
} from "./NodeTreeManager/types/NodeTreeParent";
import { Core, isCore } from "./Core/types/Core";
import { DefaultCore } from "./Core/DefaultCore";
import { createRichWrapletApi } from "./Wraplet/createRichWrapletApi";
import { Constructable } from "./utils/types/Utils";
import { UnsupportedNodeTypeError } from "./errors";
import { RichWrapletApi } from "./Wraplet/types/RichWrapletApi";

export abstract class AbstractWraplet<
  N extends Node = Node,
  M extends WrapletChildrenMap = {},
>
  implements Wraplet<N>, Groupable, NodeTreeParent
{
  public [WrapletSymbol]: true = true;
  public [GroupableSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;

  protected destroyListeners: DestroyListener<Wraplet<N>>[] = [];

  public wraplet: RichWrapletApi<N>;

  constructor(protected core: Core<N, M>) {
    if (!isCore(core)) {
      throw new Error("AbstractWraplet requires a Core instance.");
    }

    const supportedNodeTypes = this.supportedNodeTypes();
    if (supportedNodeTypes !== null) {
      if (
        !supportedNodeTypes.includes(core.node.constructor as Constructable<N>)
      ) {
        throw new UnsupportedNodeTypeError(
          `Node type ${core.node.constructor.name} is not supported by the ${this.constructor.name} wraplet.`,
        );
      }
    }

    core.addDestroyChildListener(this.onChildDestroy.bind(this));
    core.addInstantiateChildListener(this.onChildInstantiate.bind(this));

    core.instantiateChildren();

    this.wraplet = createRichWrapletApi<N, M>({
      core: this.core,
      wraplet: this,
      destroyListeners: this.destroyListeners,
    });
  }

  protected get children(): WrapletChildren<M> {
    return this.core.children;
  }

  /**
   * This method will be ivoked if one of the wraplet's children has been destroyed.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onChildDestroy(child: ChildInstance<M, keyof M>, id: keyof M) {}

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
   * Subclasses must return an array of constructors covering all types in union N.
   * Wrap the result in the `supportedTypeCheck` helper to make sure that the array contains all
   * and only classes that extend the given type.
   */
  protected supportedNodeTypes(): readonly Constructable<N>[] | null {
    return null;
  }

  /**
   * Helper for subclasses to easily satisfy the exhaustive check.
   */
  protected supportedNodeTypesGuard<T extends readonly Constructable<N>[]>(
    types: T & (Exclude<N, InstanceType<T[number]>> extends never ? T : never),
  ): T {
    return types;
  }

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
