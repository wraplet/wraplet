import { AbstractWraplet, WrapletChildrenMap } from "../../src";
import { WrapletChildren } from "../../src/types/WrapletChildren";

export abstract class BaseTestWraplet<
  T extends WrapletChildrenMap,
  E extends Element = Element,
> extends AbstractWraplet<T, E> {
  public addAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
  }

  public getChild<C extends keyof T>(name: C): WrapletChildren<T>[C] {
    return this.children[name];
  }

  public hasChild(name: keyof T): boolean {
    return !!this.children[name];
  }

  public static create<
    E extends Element = Element,
    C extends BaseTestWraplet<WrapletChildrenMap, E> = BaseTestWraplet<
      WrapletChildrenMap,
      E
    >,
  >(selectorAttribute: string): C | null {
    const wraplets = this.createWraplets(
      document,
      [],
      `[${selectorAttribute}]`,
    );
    if (wraplets.length === 0) {
      return null;
    }

    return wraplets[0];
  }

  public static createAll<C extends BaseTestWraplet<WrapletChildrenMap>>(
    selectorAttribute: string,
  ): C[] {
    return this.createWraplets(document, [], `[${selectorAttribute}]`) as C[];
  }
}
