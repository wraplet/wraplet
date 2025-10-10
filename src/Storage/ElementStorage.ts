import { Storage } from "../types/Storage/Storage";
import { StorageValidationError } from "../errors";
import { StorageValidators } from "../types/Storage/StorageValidators";
import { ElementOptionsMerger } from "./ElementOptionsMerger";

export type ElementStorageOptions<D extends Record<string, unknown>> = {
  keepFresh: boolean;
  elementOptionsMerger: ElementOptionsMerger<D>;
};

export class ElementStorage<D extends Record<string, unknown>>
  implements Storage<D>
{
  private data;
  private options: ElementStorageOptions<D>;

  constructor(
    private element: Element,
    private attribute: string,
    private defaults: D,
    private validators: StorageValidators<D>,
    options: Partial<ElementStorageOptions<D>> = {},
  ) {
    this.options = {
      keepFresh: true,
      elementOptionsMerger: (defaultOptions, elementOptions) => {
        return { ...defaultOptions, ...elementOptions };
      },
      ...options,
    };
    this.data = this.fetchFreshData();
  }

  public has(key: keyof D): boolean {
    const data = this.getAll();
    return key in data;
  }

  public get<T extends keyof D>(key: T): D[T] {
    const data = this.getAll();
    return data[key];
  }

  public getMultiple<T extends keyof D>(keys: T[]): Pick<D, T> {
    const data = this.getAll();
    return keys.reduce(
      (acc, key) => {
        acc[key] = data[key];
        return acc;
      },
      {} as Pick<D, T>,
    );
  }

  public getAll(): D {
    if (this.options.keepFresh) {
      this.refresh();
    }
    return this.data;
  }

  public set<T extends keyof D>(key: T, value: D[T]): void {
    if (!this.validators[key](value)) {
      throw new StorageValidationError(
        `Attempted to set an invalid value for the key ${String(key)}.`,
      );
    }
    const attributeValue = this.getAttributeValue(this.attribute);
    const data: D = JSON.parse(attributeValue);
    data[key] = value;
    this.setAll(data);
  }

  public setMultiple(data: Partial<D>): void {
    const oldData = this.getAll();
    this.setAll({ ...oldData, ...data });
  }

  public setAll(data: D): void {
    this.element.setAttribute(this.attribute, JSON.stringify(data));
  }

  public delete(key: keyof D): void {
    const data = this.getAll();
    if (!(key in data)) {
      return;
    }

    delete data[key];
    this.element.setAttribute(this.attribute, JSON.stringify(data));
  }

  public deleteMultiple(keys: (keyof D)[]): void {
    const data = this.getAll();
    for (const key of keys) {
      delete data[key];
    }
    this.setAll(data);
  }

  public deleteAll(): void {
    this.element.removeAttribute(this.attribute);
    this.refresh();
  }

  public refresh(): void {
    this.data = this.fetchFreshData();
  }

  private fetchFreshData(): D {
    const dataString = this.getAttributeValue(this.attribute);
    if (dataString.charAt(0) !== "{") {
      throw new StorageValidationError(`Data has to be defined as an object.`);
    }
    const data: Record<string, unknown> = JSON.parse(dataString);
    if (!this.validateData(data)) {
      throw new StorageValidationError("Invalid storage value.");
    }
    return this.options.elementOptionsMerger(this.defaults, data);
  }

  private validateData(data: Record<string, unknown>): data is D {
    for (const key in data) {
      if (!this.validators[key](data[key])) {
        return false;
      }
    }
    return true;
  }

  private getAttributeValue(attribute: string): string {
    return this.element.getAttribute(attribute) ?? "{}";
  }
}
