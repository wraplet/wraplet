import {
  AbstractNongranularKeyValueStorage,
  ValidatorsFor,
} from "./AbstractNongranularKeyValueStorage";
import { NongranularStorageOptions } from "./NongranularStorageOptions";

export class ElementStorage<
  D extends Record<string, unknown>,
  E extends Element = HTMLScriptElement,
  IS_PARTIAL extends boolean = false,
  V extends ValidatorsFor<D, IS_PARTIAL> = ValidatorsFor<D, IS_PARTIAL>,
> extends AbstractNongranularKeyValueStorage<D, IS_PARTIAL, V> {
  constructor(
    isPartial: IS_PARTIAL,
    private element: E,
    protected defaults: D,
    protected validators: V,
    options: Partial<NongranularStorageOptions<D>> = {},
  ) {
    super(isPartial, defaults, validators, options);
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
