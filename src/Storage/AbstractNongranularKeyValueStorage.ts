import {
  KeyValueStorage,
  KeyValueStorageSymbol,
} from "./types/KeyValueStorage";
import { StorageValidationError } from "../errors";
import { StorageValidators } from "./types/StorageValidators";
import { NongranularStorageOptions } from "./NongranularStorageOptions";

export abstract class AbstractNongranularKeyValueStorage<
  D extends Record<string, unknown>,
  V extends Partial<StorageValidators<D>> = Partial<StorageValidators<D>>,
> implements KeyValueStorage<D> {
  [KeyValueStorageSymbol]: true = true;
  private data: D | null = null;
  private options: NongranularStorageOptions<D>;

  constructor(
    protected defaults: D,
    protected validators: V,
    options: Partial<NongranularStorageOptions<D>>,
  ) {
    this.validateValidators(validators);
    this.options = {
      keepFresh: true,
      elementOptionsMerger: (defaultOptions, elementOptions) => {
        return { ...defaultOptions, ...elementOptions };
      },
      ...options,
    };
  }

  public async has(key: keyof D): Promise<boolean> {
    const data = await this.getAll();
    return key in data;
  }

  public async get<T extends keyof D>(key: T): Promise<D[T]> {
    const data = await this.getAll();
    return data[key];
  }

  public async getMultiple<T extends keyof D>(keys: T[]): Promise<Pick<D, T>> {
    const data = await this.getAll();
    return keys.reduce(
      (acc, key) => {
        acc[key] = data[key];
        return acc;
      },
      {} as Pick<D, T>,
    );
  }

  public async getAll(): Promise<D> {
    if (this.options.keepFresh) {
      await this.refresh();
    }
    if (!this.data) {
      await this.refresh();
    }
    return this.data as D;
  }

  public async set<T extends keyof D>(key: T, value: D[T]): Promise<void> {
    if (this.validators[key] && !this.validators[key](value)) {
      throw new StorageValidationError(
        `Attempted to set an invalid value for the key ${String(key)}.`,
      );
    }
    const attributeValue = await this.getValue();
    const data: D = JSON.parse(attributeValue);
    data[key] = value;
    await this.setAll(data);
  }

  public async setMultiple(data: Partial<D>): Promise<void> {
    const oldData = await this.getAll();
    await this.setAll({ ...oldData, ...data });
  }

  public async setAll(data: D): Promise<void> {
    await this.setValue(data);
  }

  public async delete(key: keyof D): Promise<void> {
    const data = await this.getAll();
    if (!(key in data)) {
      return;
    }

    delete data[key];
    await this.setValue(data);
  }

  public async deleteMultiple(keys: (keyof D)[]): Promise<void> {
    const data = await this.getAll();
    for (const key of keys) {
      delete data[key];
    }
    await this.setAll(data);
  }

  public async deleteAll(): Promise<void> {
    await this.deleteAllValues();
    await this.refresh();
  }

  public async refresh(): Promise<void> {
    this.data = await this.fetchFreshData();
  }

  private async fetchFreshData(): Promise<D> {
    const dataString = await this.getValue();
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
      if (!(key in this.validators)) {
        return false;
      } else if (this.validators[key] && !this.validators[key](data[key])) {
        return false;
      }
    }
    return true;
  }

  private validateValidators(validators: V): void {
    for (const key in validators) {
      if (typeof validators[key] !== "function") {
        throw new StorageValidationError(
          `Validator for ${key} is not a function.`,
        );
      }
    }
  }

  protected abstract getValue(): Promise<string>;

  protected abstract setValue(value: D): Promise<void>;

  protected abstract deleteAllValues(): Promise<void>;
}
