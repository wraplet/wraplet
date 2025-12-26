import { StorageValidators } from "./types/StorageValidators";
import { AbstractNongranularKeyValueStorage } from "./AbstractNongranularKeyValueStorage";
import { NongranularStorageOptions } from "./NongranularStorageOptions";

export class ElementStorage<
  D extends Record<string, unknown>,
  E extends Element = HTMLScriptElement,
  V extends Partial<StorageValidators<D>> = Partial<StorageValidators<D>>,
> extends AbstractNongranularKeyValueStorage<D, V> {
  constructor(
    private element: E,
    protected defaults: D,
    protected validators: V,
    options: Partial<NongranularStorageOptions<D>> = {},
  ) {
    super(defaults, validators, options);
  }

  protected async getValue(): Promise<string> {
    return this.element.textContent || "{}";
  }

  protected async setValue(value: D): Promise<void> {
    this.element.textContent = JSON.stringify(value);
  }

  protected async deleteAllValues(): Promise<void> {
    this.element.textContent = "{}";
  }
}
