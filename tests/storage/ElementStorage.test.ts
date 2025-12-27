import "../setup";
import { ElementStorage } from "../../src/storage";
import { StorageValidationError } from "../../src/errors";

it("ElementStorage basic CRUD and defaults", async () => {
  type Options = {
    option1: string;
    option2?: boolean;
    option3?: string;
  };

  const element = document.createElement("script");
  element.textContent = '{"option1":"initial value"}';

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
    option3: (value) => typeof value === "string",
  };

  const storage = new ElementStorage<Options>(
    false,
    element,
    { option1: "default value" },
    validators,
    { keepFresh: true },
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

  // deleteAll clears base and returns defaults
  await storage.set("option1", "temp");
  await storage.deleteAll();
  expect(await storage.getAll()).toEqual({ option1: "default value" });

  // element textContent should update when setAll
  await storage.setAll({ option1: "new value" });
  expect(element.textContent).toEqual('{"option1":"new value"}');
});

it("uses '{}' when element.textContent is empty (line 19)", async () => {
  type Options = { option1: string; option2?: boolean };

  const element = document.createElement("script");
  // Do not set textContent so it's empty string by default

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
  };

  const storage = new ElementStorage<Options>(
    false,
    element,
    { option1: "default value" },
    validators,
  );

  // Since textContent is empty, getValue() should return "{}",
  // which results in merged defaults only.
  expect(await storage.getAll()).toEqual({ option1: "default value" });
});

it("ElementStorage freshness on/off and default behavior", async () => {
  type Options = { option1: string; option2?: boolean };

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
  };

  // keepFresh true (default)
  const el1 = document.createElement("script");
  el1.textContent = '{"option1":"initial value"}';
  const s1 = new ElementStorage<Options>(
    false,
    el1,
    { option1: "default value" },
    validators,
  );
  el1.textContent = '{"option1":"fresh data"}';
  expect(await s1.get("option1")).toEqual("fresh data");

  // keepFresh false
  const el2 = document.createElement("script");
  el2.textContent = '{"option1":"initial value"}';
  const s2 = new ElementStorage<Options>(
    false,
    el2,
    { option1: "default value" },
    validators,
    { keepFresh: false },
  );

  const func = async () => {
    const data = await s2.getAll();
    expect(data).toEqual({ option1: "initial value" });
  };

  // This is testing if refresh is done automatically on `getAll`.
  await expect(func).resolves.not.toThrow();

  el2.textContent = '{"option1":"fresh data"}';
  expect(await s2.get("option1")).toEqual("initial value");
  await s2.refresh();
  expect(await s2.get("option1")).toEqual("fresh data");
});

it("ElementStorage getMultiple/setMultiple/deleteMultiple", async () => {
  type Options = { option1: string; option2?: boolean; option3?: string };
  const el = document.createElement("script");
  el.textContent = '{"option1":"initial"}';
  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v) => typeof v === "string",
    option2: (v) => typeof v === "boolean",
    option3: (v) => typeof v === "string",
  };
  const storage = new ElementStorage<Options>(
    false,
    el,
    { option1: "def" },
    validators,
  );

  await storage.deleteAll();
  await storage.setMultiple({
    option1: "some value",
    option2: true,
    option3: "x",
  });
  expect(await storage.getAll()).toEqual({
    option1: "some value",
    option2: true,
    option3: "x",
  });

  await storage.setAll({ option1: "v", option2: true, option3: "y" });
  await storage.deleteMultiple(["option1", "option2"]);
  expect(await storage.getAll()).toEqual({ option1: "def", option3: "y" });

  // getMultiple should return only requested keys with defaults when missing
  await storage.deleteAll();
  await storage.set("option1", "present");
  const res = await storage.getMultiple(["option1", "option2"]);
  expect(res).toEqual({ option1: "present", option2: undefined as any });
});

it("ElementStorage validators and errors", async () => {
  type Options = { option1: string; option2?: boolean };
  const el = document.createElement("script");
  el.textContent = '{"option1":"ok"}';
  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v) => typeof v === "string",
    option2: (v) => typeof v === "boolean",
  };
  const storage = new ElementStorage<Options>(
    false,
    el,
    { option1: "def" },
    validators,
  );

  // Invalid set should throw
  await expect(storage.set("option1", false as any)).rejects.toThrow(
    StorageValidationError,
  );

  // Invalid underlying data should throw on construction when validating
  const elBad = document.createElement("script");
  elBad.textContent = '{"option1":1}';
  const construct = async () => {
    const storage = new ElementStorage<Options>(
      false,
      elBad,
      { option1: "def" },
      validators,
    );
    // Get data to trigger validation.
    await storage.getAll();
  };

  await expect(construct).rejects.toThrow(StorageValidationError);
});

it("ElementStorage custom merger and warnings", async () => {
  type Options = { option1: string; option2?: string };
  const el1 = document.createElement("script");
  el1.textContent = '{"option1":"initial"}';
  const validators1: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v) => typeof v === "string",
    option2: (v) => typeof v === "string",
  };
  const s1 = new ElementStorage<Options>(
    false,
    el1,
    { option1: "def" },
    validators1,
    {
      elementOptionsMerger: (defaults, elementOptions) => ({
        ...defaults,
        ...elementOptions,
        option1: "overridden",
      }),
    },
  );
  expect(await s1.get("option1")).toEqual("overridden");

  // Missing validator warning
  const el2 = document.createElement("script");
  el2.textContent = '{"option1":"ok","option2":"missing validator"}';
  const validators2: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v: unknown) => typeof v === "string",
    // no validator for option2
  } as any;
  const ctor1 = async () => {
    const storage = new ElementStorage<Options>(
      false,
      el2,
      { option1: "def" },
      validators2,
    );
    // Get data to trigger validation.
    await storage.getAll();
  };

  await expect(ctor1).rejects.toThrow(StorageValidationError);

  // Validator not a function warning
  const el3 = document.createElement("script");
  el3.textContent = '{"option1":"ok","option2":"bad"}';
  const validators3: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v: unknown) => typeof v === "string",
    option2: "not-a-function" as any,
  } as any;
  const ctor2 = () =>
    new ElementStorage<Options>(false, el3, { option1: "def" }, validators3);
  expect(ctor2).toThrow(StorageValidationError);
});

it("ElementStorage only single option is saved when set (no defaults persisted)", () => {
  type Options = { option1: string; option2?: string };
  const el = document.createElement("script");
  el.textContent = '{"option1":"test"}';
  const option2Default = "option2 default value";
  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v) => typeof v === "string",
    option2: (v) => typeof v === "string",
  };
  const storage = new ElementStorage<Options>(
    false,
    el,
    { option1: "default value", option2: option2Default },
    validators,
  );
  storage.set("option1", "updated");
  expect(el.textContent).not.toContain(option2Default);
});

it("ElementStorage data has to be an object (non-braced text)", async () => {
  type Options = { option1: string };
  const el = document.createElement("script");
  el.textContent = "1"; // not starting with '{'
  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (v) => typeof v === "string",
  };
  const ctor = async () => {
    const storage = new ElementStorage<Options>(
      false,
      el,
      { option1: "def" },
      validators,
    );
    await storage.getAll();
  };

  await expect(ctor).rejects.toThrow(StorageValidationError);
});
