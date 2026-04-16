/* istanbul ignore file */
import { AbstractDependentWraplet, WrapletDependencyMap } from "../../src";
import { WrapletDependencies } from "../../src/Wraplet/types/WrapletDependencies";

export abstract class BaseElementTestWraplet<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> extends AbstractDependentWraplet<Element, M> {
  public getDependency<C extends keyof M>(name: C): WrapletDependencies<M>[C] {
    return this.d[name];
  }

  public hasDependency(name: keyof M): boolean {
    return !!this.d[name];
  }

  public static create<
    M extends WrapletDependencyMap,
    C extends BaseElementTestWraplet<M> = BaseElementTestWraplet<M>,
  >(
    selectorAttribute: string,
    map: M,
    element: ParentNode = document,
    args: unknown[] = [],
  ): C | null {
    const wraplets = this.createDependentWraplets(
      element,
      selectorAttribute,
      map,
      args,
    );
    if (wraplets.length === 0) {
      return null;
    }

    return wraplets[0] as C;
  }

  public static createAll<C extends BaseElementTestWraplet>(
    selectorAttribute: string,
    map: WrapletDependencyMap = {},
    node: ParentNode = document,
  ): C[] {
    return this.createDependentWraplets(
      node,
      selectorAttribute,
      map,
      [],
    ) as unknown as C[];
  }
}
