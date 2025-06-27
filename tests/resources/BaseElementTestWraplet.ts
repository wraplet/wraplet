import { AbstractWraplet, WrapletChildrenMap } from "../../src";
import { WrapletChildren } from "../../src/types/WrapletChildren";
import { CommonMethods } from "../../src/AbstractWraplet";

export abstract class BaseElementTestWraplet<
  M extends WrapletChildrenMap = WrapletChildrenMap,
  ME extends CommonMethods = CommonMethods,
> extends AbstractWraplet<M, Element, ME> {
  public getChild<C extends keyof M>(name: C): WrapletChildren<M>[C] {
    return this.children[name];
  }

  public hasChild(name: keyof M): boolean {
    return !!this.children[name];
  }

  public static create<
    C extends BaseElementTestWraplet = BaseElementTestWraplet,
  >(selectorAttribute: string, args: unknown[] = []): C | null {
    const wraplets = this.createWraplets(
      document,
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
