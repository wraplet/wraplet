/* istanbul ignore file */
import { AbstractWraplet, WrapletDependencyMap } from "../../src";
import { WrapletDependencies } from "../../src/Wraplet/types/WrapletDependencies";
import { Core } from "../../src";

export abstract class BaseElementTestWraplet<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> extends AbstractWraplet<Element, M> {
  constructor(core: Core<Element, M>) {
    super(core);
  }

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
    map: WrapletDependencyMap,
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
    map: WrapletDependencyMap = {},
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
