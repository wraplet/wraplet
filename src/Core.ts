import { WrapletChildren } from "./types/WrapletChildren";
import { Nullable } from "./types/Utils";
import {
  ChildrenAreNotAvailableError,
  MapError,
  MissingRequiredChildError,
  RequiredChildDestroyedError,
} from "./errors";
import { Wraplet } from "./types/Wraplet";
import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { CommonMethods } from "./AbstractWraplet";
import { isWraplet } from "./utils";
import { DestroyListener } from "./types/DestroyListener";
import { InstantiateChildListener } from "./types/InstantiateChildListener";
import { ChildInstance } from "./types/ChildInstance";
import { DestroyChildListener } from "./types/DestroyChildListener";
import { CoreInitOptions } from "./types/CoreInitOptions";

type ListenerData = {
  node: Node;
  eventName: string;
  callback: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
};

export class Core<
  M extends WrapletChildrenMap = {},
  N extends Node = Node,
  CM extends CommonMethods = CommonMethods,
> {
  public isDestroyed: boolean = false;
  public isInitialized: boolean = false;
  private instantiatedChildren: Partial<WrapletChildren<M>>;

  /**
   * This is the log of all node accessors, available for easier debugging.
   */
  private __debugNodeAccessors: ((element: N) => void)[] = [];
  private destroyListeners: DestroyListener<N>[] = [];
  private destroyChildListeners: DestroyChildListener<M, keyof M>[] = [];
  private instantiateChildListeners: InstantiateChildListener<M, keyof M>[] =
    [];
  private listeners: ListenerData[] = [];

  constructor(
    public node: N,
    public map: M,
    private wraplet: Wraplet<N>,
    private initOptions: Partial<CoreInitOptions<M>> = {},
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
   * processing occurs (instantiate child listeners) that needs access to the core, so core has to
   * exist already.
   */
  public init() {
    const children = this.instantiateChildren(this.node);
    this.instantiatedChildren = this.wrapChildren(children);

    if (!this.node.wraplets) {
      this.node.wraplets = [];
    }
    this.node.wraplets.push(this.wraplet);
    this.isInitialized = true;
  }

  public instantiateChildren(node: N): WrapletChildren<M> {
    const children: Partial<Nullable<WrapletChildren<M>>> =
      this.instantiatedChildren;
    // We check if are dealing with the ParentNode object.
    if (!this.isParentNode(node)) {
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
        children[id] = this.instantiateMultipleWrapletsChild(item, node, id);
        continue;
      }

      children[id] = this.instantiateSingleWrapletChild(item, node, id);
    }

    // Now we should have all properties set, so let's assert the final form.
    return children as WrapletChildren<M>;
  }

  public syncChildren(): void {
    this.instantiatedChildren = this.instantiateChildren(this.node);
  }

  private isCorrectSingleWrapletInstanceGuard<K extends keyof M>(
    item: unknown,
    id: K,
  ): item is WrapletChildren<M>[K] {
    return item instanceof this.map[id].Class;
  }

  private findExistingWraplet(
    id: keyof M,
    childElement: Node,
  ): Wraplet<N> | null {
    if (
      this.instantiatedChildren === undefined ||
      !this.instantiatedChildren[id]
    ) {
      return null;
    }
    const existingChild = this.instantiatedChildren[id];
    const existingWrapletsOnNode = childElement.wraplets || [];
    if (this.map[id]["multiple"]) {
      if (!Array.isArray(existingChild)) {
        throw new Error("Internal logic error. Expected an array.");
      }
      const intersection = this.intersect(
        existingChild,
        existingWrapletsOnNode,
      );
      if (intersection.length === 0) {
        return null;
      } else if (intersection.length === 1) {
        return intersection[0];
      } else if (intersection.length > 1) {
        throw new Error(
          "Internal logic error. Multiple wraplets found for the same child.",
        );
      }
    } else if (this.instantiatedChildren[id] !== null) {
      return existingChild as Wraplet<N>;
    }

    return null;
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
      throw new Error(
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
  ): Wraplet<N> | null {
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
      return [] as WrapletChildren<M>[keyof WrapletChildren<M>];
    }

    // Find children elements based on the map.
    const childElements = node.querySelectorAll(selector);
    this.validateElements(id, childElements, mapItem);

    const items: Wraplet<N>[] =
      this.instantiatedChildren && this.instantiatedChildren[id]
        ? (this.instantiatedChildren[id] as Wraplet<N>[])
        : [];
    for (const childElement of childElements) {
      const existingWraplet = this.findExistingWraplet(id, childElement);
      if (existingWraplet) {
        continue;
      }
      const wraplet = this.instantiateWrapletItem(id, mapItem, childElement);
      if (!wraplet) {
        continue;
      }
      if (!this.isCorrectSingleWrapletInstanceGuard(wraplet, id)) {
        throw new Error(
          `${this.constructor.name}: The "${id}" child is not an array of the expected type.`,
        );
      }
      items.push(wraplet);
    }

    return items as WrapletChildren<M>[keyof WrapletChildren<M>];
  }

  public accessNode(callback: (node: N) => void) {
    this.__debugNodeAccessors.push(callback);
    callback(this.node);
  }

  public addDestroyListener(callback: DestroyListener<N>): void {
    this.destroyListeners.push(callback);
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
    const destroyListener = <K extends keyof M>(
      wraplet: ChildInstance<M, K>,
    ) => {
      this.removeChild(wraplet, id);

      for (const listener of this.destroyChildListeners) {
        listener(wraplet, id);
      }
    };
    // Listen for the child's destruction.
    wraplet.addDestroyListener(
      destroyListener as (wraplet: Wraplet<N>) => void,
    );
  }

  /**
   * This method allows executing the specified method on the wraplet and all its children.
   * The original wraplet and all children need to have this method implemented.
   */
  public executeOnChildren(
    children: WrapletChildren<M>,
    method: keyof CM & string,
    payload?: CM[keyof CM],
  ) {
    for (const childEntries of Object.entries(children)) {
      const name = childEntries[0];
      const child = childEntries[1];
      const map = this.map;
      if (!map[name].destructible) {
        continue;
      }

      if (Array.isArray(child)) {
        // We need to loop through the copy of the array because some items can be removed from
        // the original during the loop.
        const childArray = child.slice(0);
        for (const item of childArray) {
          if (!isWraplet<N>(item)) {
            throw new Error("Internal logic error. Item is not a wraplet.");
          }
          if (!this.wrapletHasMethodGuard(item, method)) {
            throw new Error(
              `Internal logic error. Action "${String(method)}" is not defined for the child "${name}".`,
            );
          }
          if (payload) {
            item[method](payload);
          } else {
            item[method]();
          }
        }
      } else if (isWraplet<N>(child)) {
        if (!this.wrapletHasMethodGuard(child, method)) {
          throw new Error(
            `Internal logic error. Action "${String(method)}" is not defined for the child "${name}".`,
          );
        }
        if (payload) {
          child[method](payload);
        } else {
          child[method]();
        }
      }
    }
  }

  /**
   * This method removes from nodes references to this wraplet and its children recuresively.
   */
  public destroy(): void {
    if (this.isDestroyed) {
      throw new Error("Wraplet is already destroyed.");
    }

    // Remove listeners.
    for (const listener of this.listeners) {
      const node = listener.node;
      const eventName = listener.eventName;
      const callback = listener.callback;
      const options = listener.options;
      node.removeEventListener(eventName, callback, options);
    }

    for (const listener of this.destroyListeners) {
      listener(this.wraplet);
    }
    this.destroyListeners.length = 0;

    this.removeWrapletFromNode(this.wraplet, this.node);
    this.executeOnChildren(this.children, "destroy");
    this.isDestroyed = true;
  }

  /**
   * Remove the wraplet from the list of wraplets.
   */
  public removeWrapletFromNode(wraplet: Wraplet<N>, node: N): void {
    const index = node.wraplets?.findIndex((value) => {
      return value === wraplet;
    });

    if (index !== undefined && index > -1) {
      node.wraplets?.splice(index, 1);
    }
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

  private wrapletHasMethodGuard(
    wraplet: Wraplet<N>,
    method: string,
  ): wraplet is Wraplet<N> & { [method](payload?: CM[keyof CM]): unknown } {
    return typeof (wraplet as any)[method] === "function";
  }

  private isParentNode(node: Node): node is ParentNode {
    return typeof (node as any).querySelectorAll === "function";
  }

  private childTypeGuard<S extends keyof WrapletChildren<M>>(
    variable: Wraplet<N> | Wraplet<N>[] | null,
    id: S,
  ): variable is WrapletChildren<M>[S] {
    const map = this.map;
    const Class = map[id].Class;
    const isRequired = map[id].required;
    const isMultiple = map[id].multiple;
    if (isMultiple) {
      if (!Array.isArray(variable)) {
        return false;
      }
      if (isRequired) {
        return variable.every((value) => value instanceof Class);
      }

      return true;
    }

    if (isRequired) {
      return variable instanceof Class;
    }

    return variable instanceof Class || variable === null;
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
    if (Array.isArray(this.instantiatedChildren[id])) {
      const index = this.instantiatedChildren[id].findIndex((value) => {
        return value === wraplet;
      });

      if (index === -1) {
        throw new Error(
          "Internal logic error. Destroyed child couldn't be removed because it's not among the children.",
        );
      }
      this.instantiatedChildren[id].splice(index, 1);
      return;
    }

    if (this.map[id].required) {
      throw new RequiredChildDestroyedError(
        "Required child has been destroyed.",
      );
    }

    // @ts-expect-error The type is unknown because we are dealing with a generic here.
    this.instantiatedChildren[id] = null;
  }

  private intersect<T>(a: T[], b: T[]) {
    const setB = new Set<T>(b);
    return [...new Set(a)].filter((x) => setB.has(x));
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

        function isDestroyed(wraplet: Wraplet<N>): boolean {
          return wraplet.isDestroyed;
        }

        const child: any = target[name];
        if (Array.isArray(child)) {
          const destroyed = child.find(isDestroyed);

          if (destroyed) {
            throw new Error(
              "Core error: One of the children in the array has been destroyed but not removed",
            );
          }

          return target[name];
        }

        if (child !== null && isDestroyed(child)) {
          throw new Error("The child has been destroyed");
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
}
