/* istanbul ignore file */
import { AbstractWraplet, WrapletChildrenMap } from "../../src";
import { WrapletChildren } from "../../src/types/WrapletChildren";

export abstract class BaseElementTestWraplet<
  M extends WrapletChildrenMap = WrapletChildrenMap,
> extends AbstractWraplet<M, Element> {
  public getChild<C extends keyof M>(name: C): WrapletChildren<M>[C] {
    return this.children[name];
  }

  public hasChild(name: keyof M): boolean {
    return !!this.children[name];
  }

  public static create<
    C extends BaseElementTestWraplet<any> = BaseElementTestWraplet<any>,
  >(
    selectorAttribute: string,
    args: unknown[] = [],
    element: ParentNode = document,
  ): C | null {
    const wraplets = this.createWraplets(
      element,
      `[${selectorAttribute}]`,
      args,
    );
    if (wraplets.length === 0) {
      return null;
    }

    return wraplets[0];
  }

  public static createAll<C extends BaseElementTestWraplet>(
    selectorAttribute: string,
  ): C[] {
    return this.createWraplets<Element>(
      document,
      `[${selectorAttribute}]`,
      [],
    ) as C[];
  }
}
