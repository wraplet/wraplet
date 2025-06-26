import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { WrapletChildren } from "./types/WrapletChildren";
import { Wraplet } from "./types/Wraplet";
import { DeepWriteable, Nullable } from "./types/Utils";
import { MapError, MissingRequiredChildError } from "./errors";

export abstract class AbstractWraplet<
  T extends WrapletChildrenMap = {},
  E extends Element = Element,
> implements Wraplet
{
  public isWraplet: true = true;

  /**
   * This is the log of all element accessors, available for easier debugging.
   */
  private __debugElementAccessors: ((element: E) => void)[] = [];

  protected children: WrapletChildren<T>;
  protected static debug: boolean = false;

  constructor(
    protected element: E,
    mapAlterCallback: ((map: DeepWriteable<T>) => void) | null = null,
  ) {
    if (!element) {
      throw new Error("Element is required to create a wraplet.");
    }
    const map = this.defineChildrenMap();
    if (mapAlterCallback) {
      mapAlterCallback(map);
    }
    this.children = this.instantiateChildren(map);
    if (!this.element.wraplets) {
      this.element.wraplets = [];
    }
    this.element.wraplets.push(this);
  }

  public accessElement(callback: (element: E) => void) {
    this.__debugElementAccessors.push(callback);
    callback(this.element);
  }

  protected abstract defineChildrenMap(): T;

  protected instantiateChildren(map: T): WrapletChildren<T> {
    const children: Partial<Nullable<WrapletChildren<T>>> = {};
    for (const id in map) {
      const item = map[id];
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
          ? ([] as WrapletChildren<T>[keyof WrapletChildren<T>])
          : null;
        continue;
      }

      const childElements = this.element.querySelectorAll(selector);
      if (childElements.length === 0) {
        if (isRequired) {
          throw new MissingRequiredChildError(
            `${this.constructor.name}: Couldn't find an element for the wraplet "${id}". Selector used: "${selector}".`,
          );
        }
        if ((this.constructor as any).debug) {
          console.log(
            `${this.constructor.name}: Optional child '${id}' has not been found. Selector used: "${selector}"`,
          );
        }
        children[id] = multiple
          ? ([] as WrapletChildren<T>[keyof WrapletChildren<T>])
          : null;

        continue;
      }

      const childWraplet: Wraplet[] = [];
      for (const childElement of childElements) {
        childWraplet.push(this.createWraplet(wrapletClass, childElement, args));
        if (!multiple) {
          break;
        }
      }

      const value: Wraplet | Wraplet[] = multiple
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
          `${this.constructor.name}: Child value doesn't match the map. Value: ${value}. Expected: ${map[id]["Class"].name}`,
        );
      }

      children[id] = value;
    }

    // Now we should have all properties set, so let's assert the final form.
    return children as WrapletChildren<T>;
  }

  protected createWraplet(
    wrapletClass: new (...args: any[]) => Wraplet,
    childElement: Element,
    args: unknown[] = [],
  ): Wraplet {
    return new wrapletClass(...[...[childElement], ...args]);
  }

  private childTypeGuard<S extends keyof WrapletChildren<T>>(
    variable: Wraplet | Wraplet[] | null,
    id: S,
  ): variable is WrapletChildren<T>[S] {
    const map = this.defineChildrenMap();
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

  // We can afford "any" here because this method is only for the external usage, and external
  // callers don't need to know what map is the current wraplet using, as it's its internal
  // matter.
  protected static createWraplets<T extends AbstractWraplet<any> = never>(
    node: ParentNode,
    additional_args: unknown[] = [],
    selector: string,
  ): T[] {
    if (this instanceof AbstractWraplet) {
      throw new Error("You cannot instantiate an abstract class.");
    }

    const result: T[] = [];
    const foundElements = node.querySelectorAll(selector);
    for (const element of foundElements) {
      result.push(new (this as any)(element, ...additional_args));
    }

    return result;
  }
}
