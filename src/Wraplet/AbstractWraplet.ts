import { Wraplet, WrapletSymbol } from "./types/Wraplet";
import { Constructable } from "../utils/types/Utils";
import { UnsupportedNodeTypeError } from "../errors";
import { isOverridden } from "./utils";
import { NodeManager } from "./NodeManager";
import { createWrapletApi } from "./createWrapletApi";
import { WrapletApi } from "./types/WrapletApi";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";

export abstract class AbstractWraplet<
  N extends Node = Node,
> implements Wraplet<N> {
  public [WrapletSymbol]: true = true;

  public wraplet: WrapletApi<N>;
  private _nodeManager: NodeManager<N> | undefined;

  constructor(protected node: N) {
    if (!(node instanceof Node)) {
      throw new Error("AbstractWraplet requires a Node instance.");
    }

    const supportedNodeTypes = this.supportedNodeTypes();
    if (supportedNodeTypes !== null) {
      if (!supportedNodeTypes.find((value) => node instanceof value)) {
        throw new UnsupportedNodeTypeError(
          `Node type ${node.constructor.name} is not supported by the ${this.constructor.name} wraplet.`,
        );
      }
    }

    this.wraplet = this.createWrapletApi();
  }

  /**
   * Creates the WrapletApi for this wraplet. Subclasses (e.g. AbstractDependentWraplet)
   * can override this to supply their own lifecycle callbacks without causing a
   * double-creation of WrapletApi.
   */
  protected createWrapletApi(): WrapletApi<N> {
    const initializeCallback = isOverridden(
      this,
      "onInitialize",
      AbstractWraplet,
    )
      ? this.onInitialize.bind(this)
      : undefined;

    const destroyCallback = isOverridden(this, "onDestroy", AbstractWraplet)
      ? this.onDestroy.bind(this)
      : undefined;

    return this.buildWrapletApi(initializeCallback, destroyCallback);
  }

  /**
   * Builds a WrapletApi with the given callbacks and ensures NodeManager cleanup
   * is always wired into the destroy path.
   */
  protected buildWrapletApi(
    initializeCallback?: WrapletApiFactoryBasicCallback,
    destroyCallback?: WrapletApiFactoryBasicCallback,
  ): WrapletApi<N> {
    return createWrapletApi<N>({
      node: this.node,
      wraplet: this,
      initializeCallback,
      destroyCallback: async () => {
        if (destroyCallback) {
          await destroyCallback();
        }
        if (this._nodeManager) {
          this._nodeManager.destroy();
        }
      },
    });
  }

  protected get nodeManager(): NodeManager<N> {
    if (!this._nodeManager) {
      this._nodeManager = new NodeManager(this.node);
    }
    return this._nodeManager;
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
   * Instantiates wraplets on a given ParentNode.
   */
  protected static createWraplets<
    T extends abstract new (core: any, ...args: any[]) => AbstractWraplet<any>,
  >(
    this: T,
    node: ParentNode,
    attribute: string,
    additional_args: unknown[] = [],
  ): InstanceType<T>[] {
    // @ts-expect-error TypeScript doesn't like this, but we still do this check.
    if (this === AbstractWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const result: InstanceType<T>[] = [];

    if (node instanceof Element && node.hasAttribute(attribute)) {
      result.push(new (this as any)(node, ...additional_args));
    }

    const foundElements = node.querySelectorAll(`[${attribute}]`);
    for (const element of foundElements) {
      result.push(new (this as any)(element, ...additional_args));
    }

    return result;
  }
}
