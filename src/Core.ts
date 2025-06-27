import { WrapletChildren } from "./types/WrapletChildren";
import { Nullable } from "./types/Utils";
import { MapError, MissingRequiredChildError } from "./errors";
import { Wraplet } from "./types/Wraplet";
import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { CommonMethods } from "./AbstractWraplet";
import { isWraplet } from "./utils";

type ListenerData = {
  node: Node;
  eventName: string;
  callback: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
};

export default class Core<
  M extends WrapletChildrenMap = {},
  N extends Node = Node,
  CM extends CommonMethods = CommonMethods,
> {
  /**
   * This is the log of all node accessors, available for easier debugging.
   */
  private __debugNodeAccessors: ((element: N) => void)[] = [];
  private isDestroyed: boolean = false;
  private listeners: ListenerData[] = [];
  public children: WrapletChildren<M>;

  constructor(
    public node: N,
    private map: M,
    private wraplet: Wraplet<N>,
  ) {
    this.children = this.instantiateChildren(node);
    if (!this.node.wraplets) {
      this.node.wraplets = [];
    }
    this.node.wraplets.push(wraplet);
  }

  public instantiateChildren(node: N): WrapletChildren<M> {
    const children: Partial<Nullable<WrapletChildren<M>>> = {};
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
      const selector = item.selector;
      const wrapletClass = item.Class;
      const args = item.args || [];
      const multiple = item.multiple;
      const isRequired = item.required;

      if (!selector) {
        if (isRequired) {
          throw new MapError(
            `${this.constructor.name}: Child "${id}" cannot at the same be required and have no selector.`,
          );
        }

        children[id] = multiple
          ? ([] as WrapletChildren<M>[keyof WrapletChildren<M>])
          : null;
        continue;
      }

      const childElements = (node as ParentNode).querySelectorAll(selector);
      if (childElements.length === 0) {
        if (isRequired) {
          throw new MissingRequiredChildError(
            `${this.constructor.name}: Couldn't find a node for the wraplet "${id}". Selector used: "${selector}".`,
          );
        }
        if ((this.constructor as any).debug) {
          console.log(
            `${this.constructor.name}: Optional child '${id}' has not been found. Selector used: "${selector}"`,
          );
        }
        children[id] = multiple
          ? ([] as WrapletChildren<M>[keyof WrapletChildren<M>])
          : null;

        continue;
      }

      const childWraplet: Wraplet<N>[] = [];
      for (const childElement of childElements) {
        childWraplet.push(this.createWraplet(wrapletClass, childElement, args));
        if (!multiple) {
          break;
        }
      }

      const value: Wraplet<N> | Wraplet<N>[] = multiple
        ? childWraplet
        : childWraplet[0];
      if (multiple && !value && (this.constructor as any).debug) {
        console.log(
          `${this.constructor.name}: no items for the multiple child '${id}' have been found. Selector used: "${selector}"`,
        );
      }
      if (!this.childTypeGuard(value, id)) {
        if (typeof value === "undefined") {
          throw new Error(
            `${this.constructor.name}: Couldn't intantionate the "${id}" child. Selector used: "${selector}".`,
          );
        }
        throw new Error(
          `${this.constructor.name}: Child value doesn't match the map. Value: ${value}. Expected: ${this.map[id]["Class"].name}`,
        );
      }

      children[id] = value;
    }

    // Now we should have all properties set, so let's assert the final form.
    return children as WrapletChildren<M>;
  }

  public accessNode(callback: (node: N) => void) {
    this.__debugNodeAccessors.push(callback);
    callback(this.node);
  }

  public createWraplet(
    wrapletClass: new (...args: any[]) => Wraplet<N>,
    childElement: Node,
    args: unknown[] = [],
  ): Wraplet<N> {
    return new wrapletClass(...[...[childElement], ...args]);
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
      const map = this.getChildrenMap();
      if (!map[name].destructable) {
        continue;
      }

      if (Array.isArray(child)) {
        for (const item of child) {
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

  public getChildrenMap(): M {
    const map = {} as M;
    const definedMap = this.map;
    for (const id in definedMap) {
      map[id] = this.addDefaultsToChildDefinition(definedMap[id]);
    }
    return map;
  }

  /**
   * This method removes from nodes references to this wraplet and its children recuresively.
   *
   * @protected
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
        destructable: true,
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
    const map = this.getChildrenMap();
    const Class = map[id].Class;
    const isRequired = map[id].required;
    const isMultiple = map[id].multiple;
    if (isMultiple) {
      const isArray = Array.isArray(variable);
      if (!isArray) {
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
}
