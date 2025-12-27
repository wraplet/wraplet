import {
  AbstractNongranularKeyValueStorage,
  ValidatorsFor,
} from "./AbstractNongranularKeyValueStorage";
import { NongranularStorageOptions } from "./NongranularStorageOptions";

export type ElementStorageOptions<D extends Record<string, unknown>> =
  NongranularStorageOptions<D>;

export class ElementAttributeStorage<
  D extends Record<string, unknown>,
  IS_PARTIAL extends boolean = false,
  V extends ValidatorsFor<D, IS_PARTIAL> = ValidatorsFor<D, IS_PARTIAL>,
> extends AbstractNongranularKeyValueStorage<D, IS_PARTIAL, V> {
  constructor(
    isPartial: IS_PARTIAL,
    private element: Element,
    private attribute: string,
    protected defaults: D,
    protected validators: V,
    options: Partial<ElementStorageOptions<D>> = {},
  ) {
    super(isPartial, defaults, validators, options);
  }

  protected async getValue(): Promise<string> {
    return this.element.getAttribute(this.attribute) || "{}";
  }

  protected async setValue(value: D): Promise<void> {
    this.element.setAttribute(this.attribute, JSON.stringify(value));
  }

  protected async deleteAllValues(): Promise<void> {
    this.element.removeAttribute(this.attribute);
  }
}
