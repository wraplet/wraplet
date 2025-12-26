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
    private element: E,
    protected defaults: D,
    protected validators: V,
    isPartial: IS_PARTIAL = false as IS_PARTIAL,
    options: Partial<NongranularStorageOptions<D>> = {},
  ) {
    super(defaults, validators, isPartial, options);
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
