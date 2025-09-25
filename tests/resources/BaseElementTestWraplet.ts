/* istanbul ignore file */
import { AbstractWraplet, WrapletChildrenMap } from "../../src";
import { WrapletChildren } from "../../src/types/WrapletChildren";
import { Core } from "../../src";

export abstract class BaseElementTestWraplet<
  M extends WrapletChildrenMap = WrapletChildrenMap,
> extends AbstractWraplet<M, Element> {
  constructor(core: Core<M, Element>) {
    super(core);
  }

  public getChild<C extends keyof M>(name: C): WrapletChildren<M>[C] {
    return this.children[name];
  }

  public hasChild(name: keyof M): boolean {
    return !!this.children[name];
  }

  public static create<
    M extends WrapletChildrenMap,
    C extends BaseElementTestWraplet<M> = BaseElementTestWraplet<M>,
  >(
    selectorAttribute: string,
    map: WrapletChildrenMap,
    element: ParentNode = document,
    args: unknown[] = [],
  ): C | null {
    const wraplets = this.createWraplets(element, map, selectorAttribute, args);
    if (wraplets.length === 0) {
      return null;
    }

    return wraplets[0];
  }

  public static createAll<C extends BaseElementTestWraplet>(
    selectorAttribute: string,
    map: WrapletChildrenMap = {},
    node: ParentNode = document,
  ): C[] {
    return this.createWraplets<Element>(
      node,
      map,
      selectorAttribute,
      [],
    ) as C[];
  }
}
