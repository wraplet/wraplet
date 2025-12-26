import { StorageValidators } from "./types/StorageValidators";
import { ElementOptionsMerger } from "./ElementOptionsMerger";
import { AbstractNongranularKeyValueStorage } from "./AbstractNongranularKeyValueStorage";

export type ElementStorageOptions<D extends Record<string, unknown>> = {
  keepFresh: boolean;
  elementOptionsMerger: ElementOptionsMerger<D>;
};

export class ElementAttributeStorage<
  D extends Record<string, unknown>,
  V extends Partial<StorageValidators<D>> = Partial<StorageValidators<D>>,
> extends AbstractNongranularKeyValueStorage<D> {
  constructor(
    private element: Element,
    private attribute: string,
    protected defaults: D,
    protected validators: V,
    options: Partial<ElementStorageOptions<D>> = {},
  ) {
    super(defaults, validators, options);
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
