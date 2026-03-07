import { WrapletDependencyMap } from "./Wraplet/types/WrapletDependencyMap";
import { WrapletDependencies } from "./Wraplet/types/WrapletDependencies";
import { Wraplet, WrapletSymbol } from "./Wraplet/types/Wraplet";
import { DependencyInstance } from "./Wraplet/types/DependencyInstance";
import { Groupable, GroupableSymbol } from "./types/Groupable";
import {
  NodeTreeParent,
  NodeTreeParentSymbol,
} from "./NodeTreeManager/types/NodeTreeParent";
import { Core, isCore } from "./Core/types/Core";
import { DefaultCore } from "./Core/DefaultCore";
import { createRichWrapletApi } from "./Wraplet/createRichWrapletApi";
import { Constructable } from "./utils/types/Utils";
import { UnsupportedNodeTypeError } from "./errors";
import { RichWrapletApi } from "./Wraplet/types/RichWrapletApi";

export abstract class AbstractWraplet<
  N extends Node = Node,
  M extends WrapletDependencyMap = {},
>
  implements Wraplet<N>, Groupable, NodeTreeParent
{
  public [WrapletSymbol]: true = true;
  public [GroupableSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;

  public wraplet: RichWrapletApi<N>;

  constructor(protected core: Core<N, M>) {
    if (!isCore(core)) {
      throw new Error("AbstractWraplet requires a Core instance.");
    }

    const supportedNodeTypes = this.supportedNodeTypes();
    if (supportedNodeTypes !== null) {
      if (!supportedNodeTypes.find((value) => core.node instanceof value)) {
        throw new UnsupportedNodeTypeError(
          `Node type ${core.node.constructor.name} is not supported by the ${this.constructor.name} wraplet.`,
        );
      }
    }

    const isOverridden = (methodName: string): boolean =>
      Object.prototype.hasOwnProperty.call(
        Object.getPrototypeOf(this),
        methodName,
      );

    if (isOverridden("onDependencyInitialized")) {
      core.addDependencyInitializedListener(
        this.onDependencyInitialized.bind(this),
      );
    }

    if (isOverridden("onDependencyInstantiated")) {
      core.addDependencyInstantiatedListener(
        this.onDependencyInstantiated.bind(this),
      );
    }

    if (isOverridden("onDependencyDestroyed")) {
      core.addDependencyDestroyedListener(
        this.onDependencyDestroyed.bind(this),
      );
    }

    const initializeCallback = isOverridden("onInitialize")
      ? this.onInitialize.bind(this)
      : undefined;

    const destroyCallback = isOverridden("onDestroy")
      ? this.onDestroy.bind(this)
      : undefined;

    core.instantiateDependencies();

    this.wraplet = createRichWrapletApi<N, M>({
      core: this.core,
      wraplet: this,
      initializeCallback: initializeCallback,
      destroyCallback: destroyCallback,
    });
  }

  /**
   * Dependencies.
   */
  protected get d(): WrapletDependencies<M> {
    return this.core.dependencies;
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
  protected onDependencyInitialized(
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
  protected onDependencyDestroyed(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dependency: DependencyInstance<M, keyof M>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: keyof M,
  ) {
    throw new Error("Method has to be implemented by subclass.");
  }

  /**
   * Wrapped node.
   */
  protected get node(): N {
    return this.core.node;
  }

  /**
   * This method gets invoked when the wraplet is initialized.
   */
  /* istanbul ignore next -- Base method; only called when overridden by subclass. */
  protected async onInitialize(): Promise<void> {
    throw new Error("Method has to be implemented by subclass.");
  }

  /**
   * This method gets invoked when the wraplet is destroyed.
   */
  /* istanbul ignore next -- Base method; only called when overridden by subclass. */
  protected async onDestroy(): Promise<void> {
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

  /**
   * Helper for subclasses to easily satisfy the exhaustive check.
   */
  protected supportedNodeTypesGuard<T extends readonly Constructable<N>[]>(
    types: T & (Exclude<N, InstanceType<T[number]>> extends never ? T : never),
  ): T {
    return types;
  }

  /**
   * This method makes sure that the given instance is an instance of a class belonging to the
   * given dependency.
   *
   * @param item
   * @param actualUnknownId
   * @param onlyId
   *   By hardcoding onlyId you can filter out any other dependencies. It allows you to learn not
   *   only that the class is correct, but also that the dependency is correct (in the case multiple
   *   dependencies can use the same class).
   * @protected
   */
  protected isDependencyInstance<K extends keyof M>(
    item: DependencyInstance<M, keyof M>,
    actualUnknownId: keyof M,
    onlyId: K | null = null,
  ): item is DependencyInstance<M, K> {
    return (
      actualUnknownId === (onlyId || actualUnknownId) &&
      item instanceof this.core.map[actualUnknownId]["Class"]
    );
  }

  protected static createCore<N extends Node, M extends WrapletDependencyMap>(
    node: N,
    map: M,
  ): Core<N, M> {
    return new DefaultCore(node, map);
  }

  /**
   * Instantiates wraplets on a given ParentNode.
   */
  protected static createWraplets<
    T extends abstract new (
      core: any,
      ...args: any[]
    ) => AbstractWraplet<any, any>,
  >(
    this: T,
    node: ParentNode,
    map: WrapletDependencyMap,
    attribute: string,
    additional_args: unknown[] = [],
  ): InstanceType<T>[] {
    // @ts-expect-error TypeScript doesn't like this, but we still do this check.
    if (this === AbstractWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const self = this as T & typeof AbstractWraplet;

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
      new (core: any, ...args: any[]): AbstractWraplet<any, any>;
    },
  >(
    this: T,
    node: ParentNode,
    map: WrapletDependencyMap,
    attribute: string,
    additional_args: unknown[] = [],
  ): Promise<InstanceType<T>[]> {
    const self = this as T & typeof AbstractWraplet;

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
