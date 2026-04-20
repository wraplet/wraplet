import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import { WrapletDependencies } from "./types/WrapletDependencies";
import { Wraplet } from "./types/Wraplet";
import { DependencyInstance } from "./types/DependencyInstance";
import {
  DependencyManager,
  isDependencyManager,
} from "../DependencyManager/types/DependencyManager";
import { DDM } from "../DependencyManager/DDM";
import { isOverridden } from "./utils";
import { AbstractWraplet } from "./AbstractWraplet";
import { WrapletApi } from "./types/WrapletApi";

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

    if (
      isOverridden(this, "onDependencyInitialized", AbstractDependentWraplet)
    ) {
      dm.addDependencyInitializedListener(
        this.onDependencyInitialized.bind(this),
      );
    }

    if (
      isOverridden(this, "onDependencyInstantiated", AbstractDependentWraplet)
    ) {
      dm.addDependencyInstantiatedListener(
        this.onDependencyInstantiated.bind(this),
      );
    }

    if (isOverridden(this, "onDependencyDestroyed", AbstractDependentWraplet)) {
      dm.addDependencyDestroyedListener(this.onDependencyDestroyed.bind(this));
    }

    dm.instantiateDependencies();
  }

  /**
   * Override createWrapletApi to provide DependencyManager-aware lifecycle callbacks
   * instead of the base class's version — this avoids creating two WrapletApi
   * instances.
   */
  protected override createWrapletApi(): WrapletApi {
    return this.buildWrapletApi(
      async () => {
        await this.dm.initializeDependencies();
        await this.onInitialize.bind(this)();
      },
      async () => {
        await this.onDestroy.bind(this)();
        await this.dm.destroyDependencies();
      },
    );
  }

  protected override async onDestroy(): Promise<void> {}

  protected override async onInitialize(): Promise<void> {}

  /**
   * Dependencies.
   */
  protected get d(): WrapletDependencies<M> {
    return this.dm.dependencies;
  }

  /**
   *  This method will be invoked if one of the wraplet's dependencies has been instantiated.
   */
  /* istanbul ignore next -- Base method; only called when overridden by subclass. */
  protected onDependencyInstantiated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dependency: DependencyInstance<M, keyof M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: keyof M,
  ) {
    throw new Error("Method has to be implemented by subclass.");
  }

  /**
   *  This method will be invoked if one of the wraplet's dependencies has been initialized.
   */
  /* istanbul ignore next -- Base method; only called when overridden by subclass. */
  protected async onDependencyInitialized(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dependency: DependencyInstance<M, keyof M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: keyof M,
  ) {
    throw new Error("Method has to be implemented by subclass.");
  }

  /**
   * This method will be ivoked if one of the wraplet's dependencies has been destroyed.
   */
  /* istanbul ignore next -- Base method; only called when overridden by subclass. */
  protected async onDependencyDestroyed(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dependency: DependencyInstance<M, keyof M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: keyof M,
  ) {
    throw new Error("Method has to be implemented by subclass.");
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
   */
  protected static createDependentWraplets<
    T extends abstract new (
      ddm: any,
      ...args: any[]
    ) => AbstractDependentWraplet<any, any>,
  >(
    this: T,
    node: ParentNode,
    attribute: string,
    map: WrapletDependencyMap,
    additional_args: unknown[] = [],
  ): InstanceType<T>[] {
    // @ts-expect-error TypeScript doesn't like this, but we still do this check.
    if (this === AbstractDependentWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const self = this as T & typeof AbstractDependentWraplet;

    const result: InstanceType<T>[] = [];

    if (node instanceof Element && node.hasAttribute(attribute)) {
      const dm = self.createDependencyManager(node, map);
      result.push(new (this as any)(dm, ...additional_args));
    }

    const foundElements = node.querySelectorAll(`[${attribute}]`);
    for (const element of foundElements) {
      const dm = self.createDependencyManager(element, map);
      result.push(new (this as any)(dm, ...additional_args));
    }

    return result;
  }

  /**
   * Instantiates and initializes wraplets on a given ParentNode.
   */
  protected static async createAndInitializeDependentWraplets<
    T extends {
      new (ddm: any, ...args: any[]): AbstractDependentWraplet<any, any>;
    },
  >(
    this: T,
    node: ParentNode,
    attribute: string,
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
    for (const wraplet of wraplets) {
      await wraplet.wraplet.initialize();
    }
    return wraplets;
  }
}
