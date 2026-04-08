import { NodelessWrapletSymbol, Wraplet, WrapletSymbol } from "./types/Wraplet";
import { Constructable } from "../utils/types/Utils";
import { UnsupportedNodeTypeError } from "../errors";
import { isOverridden } from "./utils";
import { NodeManager } from "./NodeManager";
import { createWrapletApi } from "./createWrapletApi";
import { WrapletApi } from "./types/WrapletApi";

export abstract class AbstractWraplet<
  N extends Node = Node,
> implements Wraplet<N> {
  public [NodelessWrapletSymbol]: true = true;
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

    const initializeCallback = isOverridden(this, "onInitialize")
      ? this.onInitialize.bind(this)
      : undefined;

    const destroyCallback = isOverridden(this, "onDestroy")
      ? this.onDestroy.bind(this)
      : undefined;

    this.wraplet = createWrapletApi<N>({
      node,
      wraplet: this,
      initializeCallback: initializeCallback,
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
}
