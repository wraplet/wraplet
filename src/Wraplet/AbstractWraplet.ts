import { Wraplet } from "./types/Wraplet";
import { Constructable } from "../utils/types/Utils";
import { UnsupportedNodeTypeError } from "../errors";
import { NodeManager } from "./NodeManager";
import { createWrapletApi } from "./createWrapletApi";
import { WrapletApi } from "./types/WrapletApi";
import { RESOLVE } from "../utils/utils";
import {
  lazyWiring,
  mergeWirings,
  wireCallback,
  Wiring,
} from "./composeWrapletApi";

export interface AbstractWrapletWiringArgs {
  initializeCallback?: () => Promise<void>;
  destroyCallback?: () => Promise<void>;
  nodeManager?: (() => NodeManager<Node> | undefined) | NodeManager<Node>;
  wirings?: Wiring[];
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
    return createWrapletApi({
      wraplet: this,
      node: this.node,
      ...AbstractWraplet.wiring({
        initializeCallback: this.onInitialize.bind(this),
        destroyCallback: this.onDestroy.bind(this),
        wirings: this.wrapletApiWirings(),
        nodeManager: () => this._nodeManager,
      }),
    });
  }

  protected wrapletApiWirings(): Wiring[] {
    return [];
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

    if (args.wirings) {
      wirings.push(...args.wirings);
    }

    const nodeManager = args.nodeManager;
    if (typeof nodeManager === "object") {
      wirings.push(nodeManager.wiring());
    } else if (typeof nodeManager === "function") {
      wirings.push(lazyWiring(() => nodeManager()?.wiring()));
    }

    if (args.initializeCallback) {
      wirings.push(wireCallback("initializeCallback", args.initializeCallback));
    }

    if (args.destroyCallback) {
      wirings.push(wireCallback("destroyCallback", args.destroyCallback));
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
    await Promise.all(wraplets.map((wraplet) => wraplet.wraplet.initialize()));
    return wraplets;
  }
}
