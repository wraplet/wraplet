import {
  KeyValueStorage,
  KeyValueStorageSymbol,
} from "./types/KeyValueStorage";
import { StorageValidationError } from "../errors";
import { StorageValidators } from "./types/StorageValidators";

export class StorageWrapper<
  D extends Record<string, unknown>,
> implements KeyValueStorage<D> {
  [KeyValueStorageSymbol]: true = true;
  constructor(
    private storage: KeyValueStorage<D>,
    private defaults: D,
    private validators: StorageValidators<D>,
  ) {}

  public async has(key: keyof D): Promise<boolean> {
    return await this.storage.has(key);
  }

  public async get<T extends keyof D>(key: T): Promise<D[T]> {
    const value = await this.storage.get(key);
    // Only validate when the underlying storage actually returned a value.
    if (value !== undefined) {
      this.validateGetValue(key, value);
      return value;
    }
    return this.defaults[key];
  }

  public async getMultiple<T extends keyof D>(keys: T[]): Promise<Pick<D, T>> {
    const multiple = await this.storage.getMultiple(keys);
    const result = { ...multiple } as Partial<Pick<D, T>>;

    for (const key of keys) {
      if (result[key] === undefined) {
        result[key] = this.defaults[key];
      }
    }

    return result as Pick<D, T>;
  }

  public async getAll(): Promise<D> {
    const all = await this.storage.getAll();
    const result: Record<string, unknown> = { ...all };

    for (const key of Object.keys(this.defaults)) {
      if (result[key] === undefined) {
        result[key] = this.defaults[key];
      }
    }

    return result as D;
  }

  public async set<T extends keyof D>(key: T, value: D[T]): Promise<void> {
    this.validateSetValue(key, value);
    await this.storage.set(key, value);
  }

  public async setMultiple(data: Partial<D>): Promise<void> {
    for (const key in data) {
      this.validateSetValue(key, data[key]);
    }
    await this.storage.setMultiple(data);
  }

  public async setAll(data: D): Promise<void> {
    for (const key in data) {
      this.validateSetValue(key, data[key]);
    }
    await this.storage.setAll(data);
  }

  public async delete(key: keyof D): Promise<void> {
    await this.storage.delete(key);
  }

  public async deleteMultiple(keys: (keyof D)[]): Promise<void> {
    await this.storage.deleteMultiple(keys);
  }

  public async deleteAll(): Promise<void> {
    await this.storage.deleteAll();
  }

  private validateGetValue(key: keyof D, value: unknown): void {
    if (!this.validators[key](value)) {
      throw new StorageValidationError(
        `Got an invalid value for the key ${String(key)}.`,
      );
    }
  }

  private validateSetValue(key: keyof D, value: unknown): void {
    if (!this.validators[key](value)) {
      throw new StorageValidationError(
        `Attempted to set an invalid value for the key ${String(key)}.`,
      );
    }
  }
}
