import { WrapletChildren } from "./types/WrapletChildren";
import { Nullable } from "./types/Utils";
import {
  ChildrenAreNotAvailableError,
  MapError,
  MissingRequiredChildError,
  RequiredChildDestroyedError,
  ChildrenTooManyFoundError,
  ChildrenAreAlreadyDestroyedError,
  InternalLogicError,
} from "./errors";
import { Wraplet } from "./types/Wraplet";
import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { getWrapletsFromNode, isParentNode } from "./utils";
import { InstantiateChildListener } from "./types/InstantiateChildListener";
import { ChildInstance } from "./types/ChildInstance";
import { DestroyChildListener } from "./types/DestroyChildListener";
import { CoreInitOptions } from "./types/CoreInitOptions";
import {
  ChildrenManager,
  ChildrenManagerSymbol,
} from "./types/ChildrenManager";
import { DestroyListener } from "./types/DestroyListener";
import { isWrapletSet, WrapletSet } from "./types/Set/WrapletSet";
import { DefaultWrapletSet } from "./Set/DefaultWrapletSet";

type ListenerData = {
  node: Node;
  eventName: string;
  callback: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
};

export class DefaultChildrenManager<
  M extends WrapletChildrenMap = {},
  N extends Node = Node,
> implements ChildrenManager<M, N>
{
  public [ChildrenManagerSymbol]: true = true;
  public isDestroyed: boolean = false;
  public isGettingDestroyed: boolean = false;
  public isInitialized: boolean = false;
  private instantiatedChildren: Partial<WrapletChildren<M>>;

  private destroyChildListeners: DestroyChildListener<M, keyof M>[] = [];
  private instantiateChildListeners: InstantiateChildListener<M, keyof M>[] =
    [];
  private listeners: ListenerData[] = [];

  constructor(
    private node: N,
    public map: M,
    initOptions: Partial<CoreInitOptions<M>> = {},
  ) {
    for (const id in map) {
      map[id] = this.addDefaultsToChildDefinition(map[id]);
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
  public init() {
    const children = this.instantiateChildren();
    this.instantiatedChildren = this.wrapChildren(children);

    this.isInitialized = true;
  }

  public instantiateChildren(): WrapletChildren<M> {
    const children: Partial<Nullable<WrapletChildren<M>>> =
      this.instantiatedChildren;
    // We check if are dealing with the ParentNode object.
    if (!isParentNode(this.node)) {
      if (Object.keys(this.map).length > 0) {
        throw new MapError(
          "If the node provided cannot have children, the children map should be empty.",
        );
      }
      return children as WrapletChildren<M>;
    }
    for (const id in this.map) {
      const item = this.map[id];
      const multiple = item.multiple;

      this.validateMapItem(id, item);
      if (multiple) {
        // We can assert as much because items
        children[id] = this.instantiateMultipleWrapletsChild(
          item,
          this.node,
          id,
        );
        continue;
      }

      children[id] = this.instantiateSingleWrapletChild(item, this.node, id);
    }

    // Now we should have all properties set, so let's assert the final form.
    return children as WrapletChildren<M>;
  }

  public syncChildren(): void {
    this.instantiatedChildren = this.instantiateChildren();
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
    const existingWrapletsOnNode = getWrapletsFromNode(childElement);
    // Handle multiple.
    if (this.map[id]["multiple"]) {
      if (!isWrapletSet<Wraplet<N>>(existingChild)) {
        throw new InternalLogicError(
          "Internal logic error. Expected a WrapletSet.",
        );
      }
      const intersection = this.intersect(
        existingChild,
        existingWrapletsOnNode,
      );
      if (intersection.length === 0) {
        return null;
      } else if (intersection.length === 1) {
        return intersection[0];
      }

      throw new InternalLogicError(
        "Internal logic error. Multiple instances of the same child found on a single node.",
      );
    }

    // Handle single.
    return existingChild as Wraplet<N>;
  }

  private instantiateSingleWrapletChild<T extends keyof M>(
    mapItem: M[T],
    node: ParentNode,
    id: Extract<T, string>,
  ): WrapletChildren<M>[T] | null {
    if (!mapItem.selector) {
      return null;
    }
    const selector = mapItem.selector;

    // Find children elements based on the map.
    const childElements = node.querySelectorAll(selector);
    this.validateElements(id, childElements, mapItem);

    if (childElements.length === 0) {
      return null;
    }

    if (childElements.length > 1) {
      throw new ChildrenTooManyFoundError(
        `${this.constructor.name}: More than one element was found for the "${id}" child. Selector used: "${selector}".`,
      );
    }

    const childElement = childElements[0];

    return this.instantiateWrapletItem<T>(id, mapItem, childElement) as
      | WrapletChildren<M>[T]
      | null;
  }

  private instantiateWrapletItem<T extends keyof M>(
    id: Extract<T, string>,
    mapItem: M[T],
    node: Node,
  ): Wraplet {
    // Re-use existing wraplet.
    const existingWraplet = this.findExistingWraplet(id, node);
    if (existingWraplet) {
      return existingWraplet;
    }

    const wrapletClass = mapItem.Class;
    const args = mapItem.args || [];
    const wraplet = this.createIndividualWraplet(wrapletClass, node, args);
    this.prepareIndividualWraplet(id, wraplet);

    for (const listener of this.instantiateChildListeners) {
      listener(wraplet as ChildInstance<M>, id);
    }

    return wraplet;
  }

  private instantiateMultipleWrapletsChild<T extends keyof M>(
    mapItem: M[T],
    node: ParentNode,
    id: Extract<T, string>,
  ): WrapletChildren<M>[keyof WrapletChildren<M>] {
    const selector = mapItem.selector;
    if (!selector) {
      return new DefaultWrapletSet() as WrapletChildren<M>[keyof WrapletChildren<M>];
    }

    // Find children elements based on the map.
    const childElements = node.querySelectorAll(selector);
    this.validateElements(id, childElements, mapItem);

    const items: WrapletSet =
      this.instantiatedChildren && this.instantiatedChildren[id]
        ? (this.instantiatedChildren[id] as WrapletSet<Wraplet<N>>)
        : new DefaultWrapletSet<Wraplet<N>>();
    for (const childElement of childElements) {
      const existingWraplet = this.findExistingWraplet(id, childElement);
      if (existingWraplet) {
        continue;
      }
      const wraplet = this.instantiateWrapletItem(id, mapItem, childElement);
      items.add(wraplet);
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

  private createIndividualWraplet(
    wrapletClass: new (...args: any[]) => Wraplet<N>,
    childElement: Node,
    args: unknown[] = [],
  ): Wraplet<N> {
    return new wrapletClass(...[...[childElement], ...args]);
  }

  private prepareIndividualWraplet<K extends Extract<keyof M, string>>(
    id: K,
    wraplet: Wraplet<N>,
  ) {
    const destroyListener: DestroyListener<N> = (<K extends keyof M>(
      wraplet: ChildInstance<M, K>,
    ) => {
      this.removeChild(wraplet, id);

      for (const listener of this.destroyChildListeners) {
        listener(wraplet, id);
      }
    }) as DestroyListener<N>;
    // Listen for the child's destruction.
    wraplet.addDestroyListener(destroyListener);
  }

  /**
   * This method removes from nodes references to this wraplet and its children recursively.
   */
  public destroy(): void {
    if (this.isDestroyed) {
      throw new ChildrenAreAlreadyDestroyedError(
        "Children are already destroyed.",
      );
    }
    this.isGettingDestroyed = true;

    // Remove listeners.
    for (const listener of this.listeners) {
      const node = listener.node;
      const eventName = listener.eventName;
      const callback = listener.callback;
      const options = listener.options;
      node.removeEventListener(eventName, callback, options);
    }

    this.destroyChildren();

    this.isGettingDestroyed = false;
    this.isDestroyed = true;
  }

  private addDefaultsToChildDefinition<A extends M[keyof M]>(definition: A): A {
    return {
      ...{
        args: [],
        destructible: true,
      },
      ...definition,
    };
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
    if (!this.isInitialized) {
      throw new ChildrenAreNotAvailableError(
        "Wraplet is not yet fully initialized. You can fetch partial children with the 'uninitializedChildren' property.",
      );
    }
    return this.instantiatedChildren as WrapletChildren<M>;
  }

  public get uninitializedChildren(): Partial<WrapletChildren<M>> {
    if (this.isInitialized) {
      throw new ChildrenAreNotAvailableError(
        "Wraplet is already initialized. Fetch children with 'children' property instead.",
      );
    }
    return this.instantiatedChildren;
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

    if (this.map[id].required && !this.isGettingDestroyed) {
      throw new RequiredChildDestroyedError(
        "Required child has been destroyed.",
      );
    }

    if (this.instantiatedChildren[id] === null) {
      throw new InternalLogicError(
        "Internal logic error. Destroyed child couldn't be removed because it's already null.",
      );
    }

    // @ts-expect-error The type is unknown because we are dealing with a generic here.
    this.instantiatedChildren[id] = null;
  }

  private intersect<T>(a: Set<T>, b: Set<T>): T[] {
    return [...a].filter((x) => b.has(x));
  }

  private validateMapItem(id: string, item: M[keyof M]): void {
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

  private validateElements(
    id: Extract<keyof M, string>,
    elements: NodeListOf<Element>,
    mapItem: M[keyof M],
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
          throw new Error("Child has not been found.");
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

    if (initOptions.mapAlterCallback) {
      initOptions.mapAlterCallback(this.map);
    }

    for (const listener of initOptions.instantiateChildListeners) {
      this.instantiateChildListeners.push(listener);
    }

    for (const listener of initOptions.destroyChildListeners) {
      this.destroyChildListeners.push(listener);
    }
  }

  private destroyChildren(): void {
    for (const [key, child] of Object.entries(this.children)) {
      if (!child || !this.map[key]["destructible"]) {
        continue;
      }
      if (isWrapletSet(child)) {
        for (const item of child) {
          item.destroy();
        }
      } else {
        child.destroy();
      }
    }
  }
}
