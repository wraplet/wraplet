import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import { WrapletDependencies } from "./types/WrapletDependencies";
import { Wraplet } from "./types/Wraplet";
import {
  DependencyManager,
  isDependencyManager,
} from "../DependencyManager/types/DependencyManager";
import { DDM } from "../DependencyManager/DDM";
import { AbstractWraplet, AbstractWrapletWiringArgs } from "./AbstractWraplet";
import { lazyWiring, Wiring } from "./composeWrapletApi";

interface AbstractDependentWrapletWiringArgs extends AbstractWrapletWiringArgs {
  dependencyManager: (() => DependencyManager) | DependencyManager;
}

export abstract class AbstractDependentWraplet<
  N extends Node = Node,
  M extends WrapletDependencyMap = {},
>
  extends AbstractWraplet<N>
  implements Wraplet
{
  constructor(protected dm: DependencyManager<N, M>) {
    if (!isDependencyManager<N, M>(dm)) {
      throw new Error(
        "AbstractDependentWraplet requires an instance implementing the DependencyManager interface.",
      );
    }

    super(dm.node);

    dm.instantiateDependencies();
  }

  protected override wrapletApiWirings(): Wiring[] {
    return [
      AbstractDependentWraplet.wiring({
        dependencyManager: () => this.dm,
      }),
    ];
  }

  /**
   * Dependencies.
   */
  protected get d(): WrapletDependencies<M> {
    return this.dm.dependencies;
  }

  public static wiring(args: AbstractDependentWrapletWiringArgs): Wiring {
    const wirings = [...(args.wirings ?? [])];

    if (!args.wirings) {
      args.wirings = wirings;
    }

    const dependencyManagerArg = args.dependencyManager;
    if (typeof dependencyManagerArg === "function") {
      wirings.push(lazyWiring(() => dependencyManagerArg().wiring()));
    }

    if (typeof dependencyManagerArg === "object") {
      wirings.push(dependencyManagerArg.wiring());
    }

    return super.wiring(args);
  }

  protected static createDependencyManager<
    N extends Node,
    M extends WrapletDependencyMap,
  >(node: N, map: M): DependencyManager<N, M> {
    return new DDM(node, map);
  }

  protected static override createWraplets(): InstanceType<
    abstract new (...args: any) => any
  > {
    throw new Error(
      "This method is not supported for AbstractDependentWraplet.",
    );
  }

  protected static override createAndInitializeWraplets(): Promise<
    InstanceType<abstract new (...args: any) => any>
  > {
    throw new Error(
      "This method is not supported for AbstractDependentWraplet.",
    );
  }

  /**
   * Instantiates wraplets on a given ParentNode.
   *
   * @param node - The ParentNode to instantiate wraplets on.
   * @param attribute - The attribute to look for or a function to retrieve nodes.
   * @param map - The dependency map for the wraplets.
   * @param additional_args - Additional arguments to pass to the wraplet constructor.
   *
   * @returns An array of instantiated wraplets.
   */
  protected static createDependentWraplets<
    T extends abstract new (
      ddm: any,
      ...args: any[]
    ) => AbstractDependentWraplet<any, any>,
    PN extends ParentNode,
  >(
    this: T,
    node: PN,
    attribute: string | ((node: PN) => Iterable<Node>),
    map: WrapletDependencyMap,
    additional_args: unknown[] = [],
  ): InstanceType<T>[] {
    // @ts-expect-error TypeScript doesn't like this, but we still do this check.
    if (this === AbstractDependentWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const self = this as T & typeof AbstractDependentWraplet;

    const result: InstanceType<T>[] = [];
    let elements: Iterable<Node>;

    if (typeof attribute === "function") {
      elements = attribute(node);
    } else {
      if (node instanceof Element && node.hasAttribute(attribute)) {
        const dm = self.createDependencyManager(node, map);
        result.push(new (this as any)(dm, ...additional_args));
      }

      elements = node.querySelectorAll(`[${attribute}]`);
    }

    for (const element of elements) {
      const dm = self.createDependencyManager(element, map);
      result.push(new (this as any)(dm, ...additional_args));
    }

    return result;
  }

  /**
   * Instantiates and initializes wraplets on a given ParentNode.
   *
   * @param node - The ParentNode to instantiate wraplets on.
   * @param attribute - The attribute to look for or a function to retrieve nodes.
   * @param map - The dependency map for the wraplets.
   * @param additional_args - Additional arguments to pass to the wraplet constructor.
   *
   * @returns An array of instantiated and initialized wraplets.
   */
  protected static async createAndInitializeDependentWraplets<
    T extends {
      new (ddm: any, ...args: any[]): AbstractDependentWraplet<any, any>;
    },
    PN extends ParentNode,
  >(
    this: T,
    node: PN,
    attribute: string | ((node: PN) => Iterable<Node>),
    map: WrapletDependencyMap,
    additional_args: unknown[] = [],
  ): Promise<InstanceType<T>[]> {
    const self = this as T & typeof AbstractDependentWraplet;

    const wraplets: InstanceType<T>[] = self.createDependentWraplets(
      node,
      attribute,
      map,
      additional_args,
    );
    await Promise.all(wraplets.map((wraplet) => wraplet.wraplet.initialize()));
    return wraplets;
  }
}
