import "../setup";
import {
  AbstractNongranularKeyValueStorage,
  NongranularStorageOptions,
  StorageValidator,
  StorageValidators,
} from "../../src/storage";
import { StorageValidationError } from "../../src/errors";

// A minimal concrete storage for testing the abstract behaviors.
// It uses a shared in-memory string as the memory store.
class InMemoryNongranularStorage<
  D extends Record<string, unknown>,
> extends AbstractNongranularKeyValueStorage<D> {
  constructor(
    private memory: { value: string },
    defaults: D,
    validators: StorageValidators<D>,
    options: Partial<NongranularStorageOptions<D>> = {},
  ) {
    super(defaults, validators, options);
  }

  protected async getValue(): Promise<string> {
    return this.memory.value || "{}";
  }

  protected async setValue(value: D): Promise<void> {
    this.memory.value = JSON.stringify(value);
  }

  protected async deleteAllValues(): Promise<void> {
    this.memory.value = "{}";
  }
}

describe("AbstractNongranularStorage via in-memory subclass", () => {
  type Options = {
    option1: string;
    option2?: boolean;
    option3?: number;
  };

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v) => typeof v === "string",
    option2: (v) => typeof v === "boolean",
    option3: (v) => typeof v === "number",
  };

  it("performs basic CRUD and merges defaults", async () => {
    const memory = { value: '{"option1":"initial"}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
    );

    // has/get with merged defaults
    expect(await storage.has("option1")).toBe(true);
    expect(await storage.get("option1")).toBe("initial");
    expect(await storage.getAll()).toEqual({ option1: "initial" });

    // set updates memory
    await storage.set("option1", "updated");
    expect(await storage.get("option1")).toBe("updated");
    expect(memory.value).toBe('{"option1":"updated"}');

    // setMultiple merges with existing
    await storage.setMultiple({ option2: false });
    expect(await storage.getAll()).toEqual({
      option1: "updated",
      option2: false,
    });

    // setAll replaces content
    await storage.setAll({ option1: "x", option3: 3 } as Options);
    expect(JSON.parse(memory.value)).toEqual({ option1: "x", option3: 3 });

    // getMultiple returns only requested keys
    expect(await storage.getMultiple(["option1", "option3"])).toEqual({
      option1: "x",
      option3: 3,
    });

    // delete existing and non-existing
    await storage.delete("option3");
    expect(await storage.getAll()).toEqual({ option1: "x" });
    // @ts-expect-error intentionally deleting a key not declared
    await storage.delete("doesNotExist");
  });

  it("deleteAll clears base and returns defaults afterwards", async () => {
    const memory = { value: '{"option1":"val"}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
    );

    await storage.deleteAll();
    expect(memory.value).toBe("{}");
    expect(await storage.getAll()).toEqual({ option1: "default" });
  });

  it("respects keepFresh=true (default): reads see external changes", async () => {
    const memory = { value: '{"option1":"a"}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
    );

    expect(await storage.get("option1")).toBe("a");
    // external change in the memory store
    memory.value = '{"option1":"fresh"}';
    // With keepFresh true, subsequent read should reflect newest value
    expect(await storage.get("option1")).toBe("fresh");
  });

  it("respects keepFresh=false: caches until refresh()", async () => {
    const memory = { value: '{"option1":"one"}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
      { keepFresh: false },
    );

    // first read loads cache
    expect(await storage.get("option1")).toBe("one");
    // external change shouldn't be visible without refresh
    memory.value = '{"option1":"two"}';
    expect(await storage.get("option1")).toBe("one");
    // after refresh it should reflect
    await storage.refresh();
    expect(await storage.get("option1")).toBe("two");
  });

  it("supports custom elementOptionsMerger", async () => {
    const memory = { value: '{"option2":false}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
      {
        // custom merger: element options override defaults and also add a marker key
        elementOptionsMerger: (defaults, options) =>
          ({
            ...(defaults as object),
            ...(options as object),
            __merged: true,
          }) as unknown as Options,
      },
    );

    const all = await storage.getAll();
    // default merged with element values
    expect(all).toMatchObject({ option1: "default", option2: false });
    // Ensure the marker exists
    expect((all as unknown as { __merged: boolean }).__merged).toBe(true);
  });

  it("throws when incoming data is not an object (must start with '{')", async () => {
    const memory = { value: "[]" };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
    );

    await expect(storage.getAll()).rejects.toThrow(StorageValidationError);
  });

  it("throws when unknown keys are present in data", async () => {
    const memory = { value: '{"unknown":123}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
    );

    await expect(storage.getAll()).rejects.toThrow(StorageValidationError);
  });

  it("validator is enforced on set()", async () => {
    const memory = { value: '{"option1":"ok"}' };
    const storage = new InMemoryNongranularStorage<Options>(
      memory,
      { option1: "default" },
      validators,
    );

    await expect(
      storage.set("option1", 123 as unknown as string),
    ).rejects.toThrow(StorageValidationError);
  });

  it("constructor validates validators are functions", () => {
    const badValidators = {
      option1: {} as unknown as StorageValidator, // not a function
    } as Partial<Record<keyof Options, StorageValidator>> as Record<
      keyof Options,
      StorageValidator
    >;

    const memory = { value: "{}" };
    expect(
      () =>
        new InMemoryNongranularStorage<Options>(
          memory,
          { option1: "default" },
          badValidators,
        ),
    ).toThrow(StorageValidationError);
  });
});
