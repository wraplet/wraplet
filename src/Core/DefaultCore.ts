import { WrapletChildren } from "../Wraplet/types/WrapletChildren";
import { Nullable } from "../utils/types/Utils";
import {
  ChildrenAreAlreadyDestroyedError,
  ChildrenAreNotAvailableError,
  ChildrenTooManyFoundError,
  InternalLogicError,
  MapError,
  MissingRequiredChildError,
  RequiredChildDestroyedError,
  UnsupportedNodeTypeError,
} from "../errors";
import { Wraplet } from "../Wraplet/types/Wraplet";
import {
  isWrapletChildrenMap,
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../Wraplet/types/WrapletChildrenMap";
import { isParentNode } from "../NodeTreeManager/utils";
import { InstantiateChildListener } from "./types/InstantiateChildListener";
import { ChildInstance } from "../Wraplet/types/ChildInstance";
import { DestroyChildListener } from "./types/DestroyChildListener";
import { CoreInitOptions } from "./types/CoreInitOptions";
import { Core, CoreSymbol } from "./types/Core";
import { DestroyListener } from "./types/DestroyListener";
import { isWrapletSet, WrapletSet } from "../Set/types/WrapletSet";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import {
  SelectorCallback,
  WrapletChildDefinitionWithDefaults,
} from "../Wraplet/types/WrapletChildDefinition";
import { NodeTreeParentSymbol } from "../NodeTreeManager/types/NodeTreeParent";
import { MapWrapper } from "../Map/MapWrapper";
import { WrapletCreator, WrapletCreatorArgs } from "./types/WrapletCreator";
import { isArgCreator } from "./types/ArgCreator";
import { defaultWrapletCreator } from "./defaultWrapletCreator";
import { Status, StatusWritable } from "../Wraplet/types/Status";

type ListenerData = {
  node: Node;
  eventName: string;
  callback: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
};

export class DefaultCore<
  N extends Node = Node,
  M extends WrapletChildrenMap = {},
> implements Core<N, M> {
  public [CoreSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;
  private childrenAreInstantiated: boolean = false;
  private statusWritable: StatusWritable = {
    isDestroyed: false,
    isGettingDestroyed: false,
    isInitialized: false,
    isGettingInitialized: false,
  };

  public get status(): Status {
    return this.statusWritable;
  }

  public mapWrapper: MapWrapper<M>;
  private instantiatedChildren: Partial<WrapletChildren<M>> = {};

  private destroyChildListeners: DestroyChildListener<M, keyof M>[] = [];
  private instantiateChildListeners: InstantiateChildListener<M, keyof M>[] =
    [];
  private listeners: ListenerData[] = [];

  private wrapletCreator: WrapletCreator<Node, WrapletChildrenMap> =
    defaultWrapletCreator;

  constructor(
    public node: N,
    map: M | MapWrapper<M>,
    initOptions: Partial<CoreInitOptions<M>> = {},
  ) {
    if (!(node instanceof Node)) {
      throw new Error("The node provided to the Core is not a valid node.");
    }
    if (isWrapletChildrenMap(map)) {
      this.mapWrapper = new MapWrapper(map);
    } else if (map instanceof MapWrapper) {
      this.mapWrapper = map;
    } else {
      throw new MapError("The map provided to the Core is not a valid map.");
    }

    this.processInitOptions(initOptions);
    this.instantiatedChildren = {};
  }

  /**
   * Initialize core.
   *
   * We couldn't put this step in the constructor, because during initialization some wraplet
   * processing occurs (instantiate child listeners) that needs access to the children manager,
   * so the children manager has to exist already.
   */
  public async initializeChildren() {
    this.statusWritable.isGettingInitialized = true;

    const childInstances: Wraplet[] = Object.values(
      this.instantiatedChildren,
    ).flatMap((child) => {
      if (!child) return [];
      return isWrapletSet(child) ? Array.from(child) : [child];
    });

    await Promise.all(
      childInstances.map((child) => child.wraplet.initialize()),
    );

    this.statusWritable.isInitialized = true;
    this.statusWritable.isGettingInitialized = false;

    // If destruction has been invoked in the meantime, we can finally do it when initialization
    // is finished.
    if (this.statusWritable.isGettingDestroyed) {
      await this.destroy();
    }
  }

  public get map(): WrapletChildrenMapWithDefaults<M> {
    return this.mapWrapper.getStartingMap() as WrapletChildrenMapWithDefaults<M>;
  }

  public instantiateChildren(): void {
    const children: Partial<Nullable<WrapletChildren<M>>> =
      this.instantiatedChildren;
    // We check if are dealing with the ParentNode object.
    if (!isParentNode(this.node)) {
      for (const id in this.map) {
        const childDefinition = this.map[id];
        this.validateMapItemForNonParent(id, childDefinition);
      }
      return;
    }
    for (const id in this.map) {
      const childDefinition = this.map[id];
      const multiple = childDefinition.multiple;

      const mapWrapper = this.mapWrapper.clone([...this.mapWrapper.path, id]);

      this.validateMapItem(id, childDefinition);
      if (multiple) {
        // We can assert as much because items
        children[id] = this.instantiateMultipleWrapletsChild(
          childDefinition,
          mapWrapper,
          this.node,
          id,
        );
        continue;
      }

      children[id] = this.instantiateSingleWrapletChild(
        childDefinition,
        mapWrapper,
        this.node,
        id,
      );
    }
    if (!this.childrenAreInstantiated) {
      this.instantiatedChildren = this.wrapChildren(
        children as WrapletChildren<M>,
      );
      this.childrenAreInstantiated = true;
    }
  }

  public async syncChildren(): Promise<void> {
    this.instantiateChildren();
    await this.initializeChildren();
  }

  public getNodeTreeChildren(): Wraplet[] {
    const children: Wraplet[] = [];
    for (const child of Object.values(this.children)) {
      if (child === null) {
        continue;
      }
      if (isWrapletSet(child)) {
        for (const item of child) {
          children.push(item);
        }
      } else {
        children.push(child);
      }
    }

    // Return only descendants.
    return children.filter((child) => {
      let result = false;
      child.wraplet.accessNode((childsNode) => {
        result = this.node.contains(childsNode);
      });
      return result;
    });
  }

  private findExistingWraplet(id: keyof M, childElement: Node): Wraplet | null {
    // If a child doesn't have instantiated wraplets yet, then return null.
    if (
      this.instantiatedChildren === undefined ||
      !this.instantiatedChildren[id]
    ) {
      return null;
    }
    const existingChild = this.instantiatedChildren[id];
    // Handle multiple.
    if (this.map[id]["multiple"]) {
      if (!isWrapletSet<Wraplet<N>>(existingChild)) {
        throw new InternalLogicError(
          "Internal logic error. Expected a WrapletSet.",
        );
      }

      const existingWraplets = existingChild.find((wraplet) => {
        let result = false;

        wraplet.wraplet.accessNode((node) => {
          if (node === childElement) {
            result = true;
          }
        });

        return result;
      });

      if (existingWraplets.length === 0) {
        return null;
      }

      if (existingWraplets.length > 1) {
        throw new InternalLogicError(
          "Internal logic error. Multiple instances wrapping the same element found in the core.",
        );
      }

      return existingWraplets[0];
    }

    // Handle single.
    return existingChild as Wraplet<N>;
  }

  private instantiateSingleWrapletChild<T extends keyof M>(
    childDefinition: WrapletChildDefinitionWithDefaults<M[T], M>,
    childMap: MapWrapper<WrapletChildrenMapWithDefaults<M>>,
    node: ParentNode,
    id: Extract<T, string>,
  ): WrapletChildren<M>[T] | null {
    if (!childDefinition.selector) {
      return null;
    }
    const selector = childDefinition.selector;

    // Find children elements based on the map.
    const childElements = this.findChildren(selector, node);

    this.validateElements(id, childElements, childDefinition);

    if (childElements.length === 0) {
      return null;
    }

    if (childElements.length > 1) {
      throw new ChildrenTooManyFoundError(
        `${this.constructor.name}: More than one element was found for the "${id}" child. Selector used: "${selector}".`,
      );
    }

    const childElement = childElements[0];

    return this.instantiateWrapletItem<T>(
      id,
      childDefinition,
      childMap,
      childElement,
    ) as WrapletChildren<M>[T];
  }

  private instantiateWrapletItem<T extends keyof M>(
    id: Extract<T, string>,
    childDefinition: WrapletChildDefinitionWithDefaults<M[T], M>,
    childMap: MapWrapper<WrapletChildrenMapWithDefaults<M>>,
    node: Node,
  ): Wraplet | null {
    // Re-use existing wraplet.
    const existingWraplet = this.findExistingWraplet(id, node);
    if (existingWraplet) {
      return existingWraplet;
    }

    const wrapletClass = childDefinition.Class;
    const creatorArgs: WrapletCreatorArgs<Node, WrapletChildrenMap> = {
      id: id,
      Class: wrapletClass,
      element: node,
      map: childMap,
      initOptions: childDefinition.coreOptions,
      args: childDefinition.args,
    };

    creatorArgs.args = creatorArgs.args.map((arg) => {
      if (isArgCreator<Node, WrapletChildrenMap>(arg)) {
        return arg.createArg(creatorArgs);
      }
      return arg;
    });
    let wraplet: Wraplet | null = null;
    try {
      wraplet = this.wrapletCreator(creatorArgs, this.constructor as any);
    } catch (e) {
      if (e instanceof UnsupportedNodeTypeError) {
        if (!childDefinition.required) {
          console.warn(
            `${e.message} Skipping instantiation of the "${id}" child.`,
          );
          return null;
        }
      }
      throw e;
    }
    this.prepareIndividualWraplet(id, wraplet);

    for (const listener of this.instantiateChildListeners) {
      listener(wraplet as ChildInstance<M>, id);
    }

    return wraplet;
  }

  private instantiateMultipleWrapletsChild<T extends keyof M>(
    childDefinition: WrapletChildDefinitionWithDefaults<M[T], M>,
    childMap: MapWrapper<WrapletChildrenMapWithDefaults<M>>,
    node: ParentNode,
    id: Extract<T, string>,
  ): WrapletChildren<M>[keyof WrapletChildren<M>] {
    const selector = childDefinition.selector;
    if (!selector) {
      return new DefaultWrapletSet() as WrapletChildren<M>[keyof WrapletChildren<M>];
    }

    // Find children elements based on the map.
    const childElements = this.findChildren(selector, node);
    this.validateElements(id, childElements, childDefinition);

    const items: WrapletSet =
      this.instantiatedChildren && this.instantiatedChildren[id]
        ? (this.instantiatedChildren[id] as WrapletSet<Wraplet<N>>)
        : new DefaultWrapletSet<Wraplet<N>>();
    for (const childElement of childElements) {
      const existingWraplet = this.findExistingWraplet(id, childElement);
      if (existingWraplet) {
        continue;
      }
      const wraplet = this.instantiateWrapletItem(
        id,
        childDefinition,
        childMap,
        childElement,
      );
      if (wraplet) {
        items.add(wraplet);
      }
    }

    return items as WrapletChildren<M>[keyof WrapletChildren<M>];
  }

  public addDestroyChildListener(
    callback: DestroyChildListener<M, keyof M>,
  ): void {
    this.destroyChildListeners.push(callback);
  }

  public addInstantiateChildListener(
    callback: InstantiateChildListener<M, keyof M>,
  ): void {
    this.instantiateChildListeners.push(callback);
  }

  public setWrapletCreator(
    wrapletCreator: WrapletCreator<Node, WrapletChildrenMap>,
  ): void {
    this.wrapletCreator = wrapletCreator;
  }

  private prepareIndividualWraplet<K extends Extract<keyof M, string>>(
    id: K,
    wraplet: Wraplet,
  ) {
    const destroyListener: DestroyListener = (<K extends keyof M>(
      wraplet: ChildInstance<M, K>,
    ) => {
      this.removeChild(wraplet, id);

      for (const listener of this.destroyChildListeners) {
        listener(wraplet, id);
      }
    }) as DestroyListener;
    // Listen for the child's destruction.
    wraplet.wraplet.addDestroyListener(destroyListener);
  }

  /**
   * This method removes from nodes references to this wraplet and its children recursively.
   */
  public async destroy(): Promise<void> {
    if (this.statusWritable.isDestroyed) {
      throw new ChildrenAreAlreadyDestroyedError(
        "Children are already destroyed.",
      );
    }
    this.statusWritable.isGettingDestroyed = true;

    if (this.statusWritable.isGettingInitialized) {
      // If we are still initializing, then postpone destruction until after
      // initialization is finished.
      // We are leaving this method, but with `isGettingDestroyed` set to true, so
      // the initialization process will know to return here after it will finish.
      return;
    }

    if (!this.statusWritable.isInitialized) {
      // If we are not initialized, then we have nothing to do here.
      this.statusWritable.isDestroyed = true;
      this.statusWritable.isGettingDestroyed = false;
      return;
    }

    // Remove listeners.
    for (const listener of this.listeners) {
      const node = listener.node;
      const eventName = listener.eventName;
      const callback = listener.callback;
      const options = listener.options;
      node.removeEventListener(eventName, callback, options);
    }

    this.listeners.length = 0;

    await this.destroyChildren();

    this.statusWritable.isInitialized = false;
    this.statusWritable.isDestroyed = true;
    this.statusWritable.isGettingDestroyed = false;
  }

  private findChildren<PN extends ParentNode>(
    selector: string | SelectorCallback<PN>,
    node: PN,
  ): Node[] {
    const defaultSelectorCallback = (
      selector: string,
      node: ParentNode,
    ): Node[] => {
      return Array.from(node.querySelectorAll(selector));
    };

    // Find children elements based on the map.
    return typeof selector === "string"
      ? defaultSelectorCallback(selector, node)
      : selector(node);
  }

  public addEventListener(
    node: Node,
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) {
    this.listeners.push({ node, eventName, callback, options });
    node.addEventListener(eventName, callback, options);
  }

  public get children(): WrapletChildren<M> {
    if (!this.childrenAreInstantiated) {
      throw new ChildrenAreNotAvailableError(
        "Wraplet is not yet fully initialized. You can fetch partial children with the 'uninitializedChildren' property.",
      );
    }
    return this.instantiatedChildren as WrapletChildren<M>;
  }

  private removeChild<K extends Extract<keyof M, string>>(
    wraplet: ChildInstance<M, K>,
    id: K,
  ): void {
    if (isWrapletSet(this.instantiatedChildren[id])) {
      if (!this.instantiatedChildren[id].delete(wraplet)) {
        throw new InternalLogicError(
          "Internal logic error. Destroyed child couldn't be removed because it's not among the children.",
        );
      }
      return;
    }

    if (this.instantiatedChildren[id] === null) {
      throw new InternalLogicError(
        "Internal logic error. Destroyed child couldn't be removed because it's already null.",
      );
    }

    // @ts-expect-error The type is unknown because we are dealing with a generic here.
    this.instantiatedChildren[id] = null;

    if (this.map[id].required && !this.status.isGettingDestroyed) {
      throw new RequiredChildDestroyedError(
        "Required child has been destroyed.",
      );
    }
  }

  private validateMapItem(
    id: string,
    item: WrapletChildDefinitionWithDefaults<M[keyof M], M>,
  ): void {
    const selector = item.selector;
    const isRequired = item.required;
    if (!selector) {
      if (isRequired) {
        throw new MapError(
          `${this.constructor.name}: Child "${id}" cannot at the same be required and have no selector.`,
        );
      }
    }
  }

  private validateMapItemForNonParent(
    id: string,
    item: WrapletChildDefinitionWithDefaults<M[keyof M], M>,
  ): void {
    if (item.required) {
      throw new MapError(
        `Dependency "${id}" error: If the node provided cannot have children, there should be no required children.`,
      );
    }
  }

  private validateElements(
    id: Extract<keyof M, string>,
    elements: Node[],
    mapItem: WrapletChildDefinitionWithDefaults<M[keyof M], M>,
  ): void {
    if (elements.length === 0 && mapItem.required) {
      throw new MissingRequiredChildError(
        `${this.constructor.name}: Couldn't find a node for the wraplet "${id}". Selector used: "${mapItem.selector}".`,
      );
    }
  }

  /**
   * Set up a proxy to check if children have not been destroyed before fetching them.
   */
  private wrapChildren(children: WrapletChildren<M>): WrapletChildren<M> {
    return new Proxy(children, {
      get: function get(target, name: string) {
        if (!(name in target)) {
          throw new Error(`Child '${name}' has not been found.`);
        }
        return target[name];
      },
    });
  }

  private defaultInitOptions(): CoreInitOptions<M> {
    return {
      instantiateChildListeners: [],
      destroyChildListeners: [],
    };
  }

  private processInitOptions(
    initOptionsPartial: Partial<CoreInitOptions<M>>,
  ): void {
    const initOptions: CoreInitOptions<M> = Object.assign(
      this.defaultInitOptions(),
      initOptionsPartial,
    );

    for (const listener of initOptions.instantiateChildListeners) {
      this.instantiateChildListeners.push(listener);
    }

    for (const listener of initOptions.destroyChildListeners) {
      this.destroyChildListeners.push(listener);
    }
  }

  private async destroyChildren(): Promise<void> {
    for (const [key, child] of Object.entries(this.children)) {
      if (!child || !this.map[key]["destructible"]) {
        continue;
      }
      if (isWrapletSet(child)) {
        for (const item of child) {
          await item.wraplet.destroy();
        }
      } else {
        await child.wraplet.destroy();
      }
    }
  }
}
