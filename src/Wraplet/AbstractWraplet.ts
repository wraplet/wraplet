import { Wraplet } from "./types/Wraplet";
import { Constructable } from "../utils/types/Utils";
import { UnsupportedNodeTypeError } from "../errors";
import { NodeManager } from "./NodeManager";
import { createWrapletApi } from "./createWrapletApi";
import { WrapletApi } from "./types/WrapletApi";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";
import { RESOLVE } from "../utils/utils";
import { composeWrapletApi, mergeWirings, Wiring } from "./composeWrapletApi";

export interface AbstractWrapletWiringArgs {
  initializeCallback?: () => Promise<void>;
  destroyCallback?: () => Promise<void>;
  nodeManager?: (() => NodeManager<Node> | undefined) | NodeManager<Node>;
}

export abstract class AbstractWraplet<
  N extends Node = Node,
> implements Wraplet {
  public wraplet: WrapletApi;
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
  protected createWrapletApi(): WrapletApi {
    // @todo Remove this condition for the next major release.
    if (
      Object.getPrototypeOf(this).buildWrapletApi !==
      AbstractWraplet.prototype.buildWrapletApi
    ) {
      return this.buildWrapletApi(
        this.onInitialize.bind(this),
        this.onDestroy.bind(this),
      );
    }

    return composeWrapletApi(this.node, this, this.wrapletApiWirings());
  }

  /**
   * Builds a WrapletApi with the given callbacks and ensures NodeManager cleanup
   * is always wired into the destroy path.
   *
   * @deprecated
   *   The new method of building WrapletApi is through adding wirings in the `wrapletApiWirings` method.
   *   `buildWrapletApi` method will be removed in future versions.
   */
  protected buildWrapletApi(
    initializeCallback?: WrapletApiFactoryBasicCallback,
    destroyCallback?: WrapletApiFactoryBasicCallback,
  ): WrapletApi {
    return createWrapletApi({
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

  /**
   * Wires up the WrapletApi with lifecycle callbacks and NodeManager integration.
   */
  protected wrapletApiWirings(): Wiring[] {
    return [
      AbstractWraplet.wiring({
        initializeCallback: this.onInitialize.bind(this),
        destroyCallback: this.onDestroy.bind(this),
        nodeManager: () => this._nodeManager,
      }),
    ];
  }

  protected get nodeManager(): NodeManager<N> {
    if (!this._nodeManager) {
      this._nodeManager = new NodeManager(this.node);
    }
    return this._nodeManager;
  }

  /**
   * Subclasses must return an array of constructors covering all types in union N.
   * Wrap the result in the `supportedTypeGuard` helper to make sure that the array contains all
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
  protected onInitialize(): Promise<void> {
    return RESOLVE;
  }

  /**
   * This method gets invoked when the wraplet is destroyed.
   */
  protected onDestroy(): Promise<void> {
    return RESOLVE;
  }

  public static wiring(args: AbstractWrapletWiringArgs): Wiring {
    const wirings: Wiring[] = [];

    const callbackWiring: Wiring = {};

    if (args.initializeCallback) {
      callbackWiring.initializeCallback = args.initializeCallback;
    }

    if (args.destroyCallback) {
      callbackWiring.destroyCallback = args.destroyCallback;
    }

    wirings.push(callbackWiring);

    if (args.nodeManager) {
      const nodeManagerArg = args.nodeManager;
      wirings.push(NodeManager.wire(nodeManagerArg));
    }

    return mergeWirings(wirings);
  }

  /**
   * Instantiates wraplets on a given ParentNode.
   *
   * @param node - The ParentNode to instantiate wraplets on.
   * @param attribute - The attribute to look for or a function to retrieve nodes.
   * @param additional_args - Additional arguments to pass to the wraplet constructor.
   *
   * @returns An array of instantiated wraplets.
   */
  protected static createWraplets<
    T extends abstract new (ddm: any, ...args: any[]) => AbstractWraplet<any>,
    PN extends ParentNode,
  >(
    this: T,
    node: PN,
    attribute: string | ((node: PN) => Iterable<Node>),
    additional_args: unknown[] = [],
  ): InstanceType<T>[] {
    // @ts-expect-error TypeScript doesn't like this, but we still do this check.
    if (this === AbstractWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const result: InstanceType<T>[] = [];
    let elements: Iterable<Node>;

    if (typeof attribute === "function") {
      elements = attribute(node);
    } else {
      if (node instanceof Element && node.hasAttribute(attribute)) {
        result.push(new (this as any)(node, ...additional_args));
      }
      elements = node.querySelectorAll(`[${attribute}]`);
    }

    for (const element of elements) {
      result.push(new (this as any)(element, ...additional_args));
    }

    return result;
  }

  /**
   * Instantiates and initializes wraplets on a given ParentNode.
   *
   * @param node - The ParentNode to instantiate wraplets on.
   * @param attribute - The attribute to look for or a function to retrieve nodes.
   * @param additional_args - Additional arguments to pass to the wraplet constructor.
   *
   * @returns An array of instantiated wraplets.
   */
  protected static async createAndInitializeWraplets<
    T extends {
      new (ddm: any, ...args: any[]): AbstractWraplet<any>;
    },
    PN extends ParentNode,
  >(
    this: T,
    node: PN,
    attribute: string | ((node: PN) => Iterable<Node>),
    additional_args: unknown[] = [],
  ): Promise<InstanceType<T>[]> {
    const self = this as T & typeof AbstractWraplet;

    const wraplets: InstanceType<T>[] = self.createWraplets(
      node,
      attribute,
      additional_args,
    );
    for (const wraplet of wraplets) {
      await wraplet.wraplet.initialize();
    }
    return wraplets;
  }
}
