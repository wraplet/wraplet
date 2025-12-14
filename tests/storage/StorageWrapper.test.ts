import "../setup";
import { StorageWrapper } from "../../src/storage";
import { StorageValidationError } from "../../src/errors";
import {
  KeyValueStorage,
  KeyValueStorageSymbol,
} from "../../src/Storage/types/KeyValueStorage";

// A simple in-memory storage to back the StorageWrapper in tests.
class InMemoryStorage<
  D extends Record<string, unknown>,
> implements KeyValueStorage<D> {
  [KeyValueStorageSymbol]: true = true;
  private data: Partial<D> = {};

  constructor(initial?: Partial<D>) {
    if (initial) this.data = { ...initial };
  }

  public async has(key: keyof D): Promise<boolean> {
    return Object.prototype.hasOwnProperty.call(this.data, key);
  }

  public async get<T extends keyof D>(key: T): Promise<D[T]> {
    return this.data[key] as D[T];
  }

  public async getMultiple<T extends keyof D>(keys: T[]): Promise<Pick<D, T>> {
    const res: Partial<Pick<D, T>> = {};
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(this.data, k)) {
        res[k] = this.data[k];
      }
    }
    return res as Pick<D, T>;
  }

  public async getAll(): Promise<D> {
    return { ...(this.data as D) } as D;
  }

  public async set<T extends keyof D>(key: T, value: D[T]): Promise<void> {
    this.data[key] = value;
  }

  public async setMultiple(data: Partial<D>): Promise<void> {
    this.data = { ...this.data, ...data };
  }

  public async setAll(data: D): Promise<void> {
    this.data = { ...data };
  }

  public async delete(key: keyof D): Promise<void> {
    delete this.data[key];
  }

  public async deleteMultiple(keys: (keyof D)[]): Promise<void> {
    for (const k of keys) {
      delete this.data[k];
    }
  }

  public async deleteAll(): Promise<void> {
    this.data = {};
  }
}

it("StorageWrapper basic CRUD and defaults", async () => {
  type Options = {
    option1: string;
    option2?: boolean;
    option3?: string;
  };

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
    option3: (value) => typeof value === "string",
  };

  const base = new InMemoryStorage<Options>({ option1: "initial value" });
  const storage = new StorageWrapper<Options>(
    base,
    { option1: "default value" },
    validators,
  );

  // has/get reflect underlying and merge defaults
  expect(await storage.has("option1")).toEqual(true);
  expect(await storage.get("option1")).toEqual("initial value");

  // setAll and getAll
  await storage.setAll({ option1: "new value", option2: false });
  expect(await storage.getAll()).toEqual({
    option1: "new value",
    option2: false,
  });

  // set single and read
  await storage.set("option1", "another value");
  expect(await storage.get("option1")).toEqual("another value");

  // delete resets to default via wrapper
  await storage.delete("option1");
  expect(await storage.get("option1")).toEqual("default value");

  // delete non-existing should not throw
  // @ts-expect-error testing non-existing key
  await storage.delete("test");

  // deleteAll clears base and wrapper returns defaults
  await storage.set("option1", "temp");
  await storage.deleteAll();
  expect(await storage.getAll()).toEqual({ option1: "default value" });

  // getMultiple merges defaults only for requested keys
  await storage.setMultiple({ option1: "some value", option2: true });
  expect(await storage.getMultiple(["option1"])).toEqual({
    option1: "some value",
  });

  // setMultiple
  await storage.deleteAll();
  await storage.setMultiple({ option1: "val", option2: true, option3: "x" });
  expect(await storage.getAll()).toEqual({
    option1: "val",
    option2: true,
    option3: "x",
  });

  // deleteMultiple
  await storage.setAll({ option1: "some value", option2: true, option3: "y" });
  await storage.deleteMultiple(["option1", "option2"]);
  expect(await storage.getAll()).toEqual({
    option1: "default value",
    option3: "y",
  });
});

it("StorageWrapper validators on set and get", async () => {
  type Options = {
    option1: string;
    option2?: boolean;
  };

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
  };

  const base = new InMemoryStorage<Options>({ option1: "ok" });
  const storage = new StorageWrapper<Options>(
    base,
    { option1: "def" },
    validators,
  );

  // Invalid set should reject
  await expect(
    storage.set("option1", false as unknown as string),
  ).rejects.toThrow(StorageValidationError);

  // Underlying invalid value should make get throw
  await base.set("option1", 123 as unknown as string);
  const getter = async () => storage.get("option1");
  await expect(getter).rejects.toThrow(StorageValidationError);
});

it("StorageWrapper getMultiple fills defaults for missing keys (covers default merge)", async () => {
  type Options = {
    option1: string;
    option2?: boolean;
  };

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
  };

  // Underlying storage only has option1; option2 is missing/undefined
  const base = new InMemoryStorage<Options>({ option1: "present" });
  const storage = new StorageWrapper<Options>(
    base,
    { option1: "def1", option2: false },
    validators,
  );

  // Request both keys; wrapper should fill default for the missing option2
  const result = await storage.getMultiple(["option1", "option2"]);
  expect(result).toEqual({ option1: "present", option2: false });
});
