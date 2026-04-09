import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import { WrapletDependencies } from "./types/WrapletDependencies";
import { Wraplet } from "./types/Wraplet";
import { DependencyInstance } from "./types/DependencyInstance";
import {
  DependencyManager,
  isDependencyManager,
} from "../DependencyManager/types/DependencyManager";
import { Core } from "../DependencyManager/Core";
import { Constructable } from "../utils/types/Utils";
import { isOverridden } from "./utils";
import { AbstractWraplet } from "./AbstractWraplet";
import { WrapletApi } from "./types/WrapletApi";

export abstract class AbstractDependentWraplet<
  N extends Node = Node,
  M extends WrapletDependencyMap = {},
>
  extends AbstractWraplet<N>
  implements Wraplet<N>
{
  constructor(protected dm: DependencyManager<N, M>) {
    if (!isDependencyManager<N, M>(dm)) {
      throw new Error(
        "AbstractDependentWraplet requires an instance implementing DependencyManager and NodeManager interfaces.",
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
   * Override createWrapletApi to provide Core-aware lifecycle callbacks
   * instead of the base class's version — this avoids creating two WrapletApi
   * instances.
   */
  protected createWrapletApi(): WrapletApi<N> {
    return this.buildWrapletApi(
      this.onInitialize.bind(this),
      this.onDestroy.bind(this),
    );
  }

  protected async onDestroy(): Promise<void> {
    await this.dm.destroy();
  }

  protected async onInitialize(): Promise<void> {
    await this.dm.initializeDependencies();
  }

  /**
   * Dependencies.
   */
  protected get d(): WrapletDependencies<M> {
    return this.dm.dependencies;
  }

  /**
   *  his method will be invoked if one of the wraplet's dependencies has been instantiated.
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
   *  his method will be invoked if one of the wraplet's dependencies has been initialized.
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

  /**
   * Subclasses must return an array of constructors covering all types in union N.
   * Wrap the result in the `supportedTypeCheck` helper to make sure that the array contains all
   * and only classes that extend the given type.
   */
  protected supportedNodeTypes(): readonly Constructable<N>[] | null {
    return null;
  }

  protected static createCore<N extends Node, M extends WrapletDependencyMap>(
    node: N,
    map: M,
  ): DependencyManager<N, M> {
    return new Core(node, map);
  }

  /**
   * Instantiates wraplets on a given ParentNode.
   */
  protected static createWraplets<
    T extends abstract new (
      core: any,
      ...args: any[]
    ) => AbstractDependentWraplet<any, any>,
  >(
    this: T,
    node: ParentNode,
    map: WrapletDependencyMap,
    attribute: string,
    additional_args: unknown[] = [],
  ): InstanceType<T>[] {
    // @ts-expect-error TypeScript doesn't like this, but we still do this check.
    if (this === AbstractDependentWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const self = this as T & typeof AbstractDependentWraplet;

    const result: InstanceType<T>[] = [];

    if (node instanceof Element && node.hasAttribute(attribute)) {
      const core = self.createCore(node, map);
      result.push(new (this as any)(core, ...additional_args));
    }

    const foundElements = node.querySelectorAll(`[${attribute}]`);
    for (const element of foundElements) {
      const core = self.createCore(element, map);
      result.push(new (this as any)(core, ...additional_args));
    }

    return result;
  }

  /**
   * Instantiates and initializes wraplets on a given ParentNode.
   */
  protected static async createAndInitializeWraplets<
    T extends {
      new (core: any, ...args: any[]): AbstractDependentWraplet<any, any>;
    },
  >(
    this: T,
    node: ParentNode,
    map: WrapletDependencyMap,
    attribute: string,
    additional_args: unknown[] = [],
  ): Promise<InstanceType<T>[]> {
    const self = this as T & typeof AbstractDependentWraplet;

    const wraplets: InstanceType<T>[] = self.createWraplets(
      node,
      map,
      attribute,
      additional_args,
    );
    for (const wraplet of wraplets) {
      await wraplet.wraplet.initialize();
    }
    return wraplets;
  }
}
