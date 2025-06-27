import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { WrapletChildren } from "./types/WrapletChildren";
import { Wraplet } from "./types/Wraplet";
import { DeepWriteable } from "./types/Utils";
import Core from "./Core";

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

  protected static debug: boolean = false;

  constructor(
    node: N,
    mapAlterCallback: ((map: DeepWriteable<M>) => void) | null = null,
  ) {
    if (!node) {
      throw new Error("Node is required to create a wraplet.");
    }
    const map = this.defineChildrenMap();

    if (mapAlterCallback) {
      mapAlterCallback(map);
    }

    this.core = new Core(node, map, this);
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

    const result: T[] = [];
    const foundElements = node.querySelectorAll(selector);
    for (const element of foundElements) {
      result.push(new (this as any)(element, ...additional_args));
    }

    return result;
  }
}
