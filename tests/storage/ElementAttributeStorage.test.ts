import "../setup";
import { ElementAttributeStorage } from "../../src/storage";
import { StorageValidationError } from "../../src";

it("Test element storage", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
    option2?: boolean;
    option3?: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
    option3: (value) => typeof value === "string",
  };

  const storage = new ElementAttributeStorage<Options>(
    false,
    element,
    attribute,
    { option1: "default value" },
    validators,
    { keepFresh: true },
  );

  // Test if the value was correctly fetched from the attribute.
  expect(await storage.has("option1")).toEqual(true);
  expect(await storage.get("option1")).toEqual("initial value");

  // Test setAll.
  await storage.setAll({ option1: "new value", option2: false });
  expect(await storage.getAll()).toEqual({
    option1: "new value",
    option2: false,
  });

  // Test if the new value is available.
  await storage.set("option1", "new value");
  expect(await storage.get("option1")).toEqual("new value");

  // Test delete.
  await storage.delete("option1");
  expect(await storage.get("option1")).toEqual("default value");

  // Test delete non-existing without errors.
  // @ts-expect-error We are testing a non-existing key.
  await storage.delete("test");

  // Test deleteAll.
  await storage.set("option1", "new value");
  await storage.deleteAll();
  expect(await storage.getAll()).toEqual({ option1: "default value" });

  // Test if the attribute's value has been updated.
  await storage.setAll({ option1: "new value" });
  expect(element.getAttribute(attribute)).toEqual('{"option1":"new value"}');
  await storage.deleteAll();
  expect(element.hasAttribute(attribute)).toBe(false);

  // Test if the default value is still available.
  expect(await storage.get("option1")).toEqual("default value");

  // Test validators.
  const validatorTrigger = async () => {
    // Intentionally set a wrong value.
    await storage.set("option1", false as any);
  };
  await expect(validatorTrigger).rejects.toThrow();

  // Test getMultiple.
  await storage.deleteAll();
  await storage.set("option1", "some value");
  await storage.set("option2", true);
  expect(await storage.getMultiple(["option1"])).toEqual({
    option1: "some value",
  });

  // Test deleteAll.
  await storage.setAll({
    option1: "some value",
    option2: true,
  });
  await storage.deleteAll();
  expect(await storage.getAll()).toEqual({ option1: "default value" });

  // Test setMultiple.
  await storage.deleteAll();
  await storage.setMultiple({
    option1: "some value",
    option2: true,
    option3: "some other value",
  });
  expect(await storage.getAll()).toEqual({
    option1: "some value",
    option2: true,
    option3: "some other value",
  });

  // Test deleteMultiple.
  await storage.setAll({
    option1: "some value",
    option2: true,
    option3: "some other value",
  });
  await storage.deleteMultiple(["option1", "option2"]);
  expect(await storage.getAll()).toEqual({
    option1: "default value",
    option3: "some other value",
  });
});

it("Test element storage fresh data", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
    option2?: boolean;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
  };

  const storage = new ElementAttributeStorage<Options>(
    false,
    element,
    attribute,
    { option1: "default value" },
    validators,
    { keepFresh: true },
  );

  // Test the freshness of data.
  element.setAttribute(attribute, '{"option1":"fresh data"}');
  expect(await storage.get("option1")).toEqual("fresh data");
});

it("Test element storage non-fresh data", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
    option2?: boolean;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "boolean",
  };

  const storage = new ElementAttributeStorage<Options>(
    false,
    element,
    attribute,
    { option1: "default value" },
    validators,
    { keepFresh: false },
  );

  await storage.refresh();

  // Test if data is indeed not fresh.
  element.setAttribute(attribute, '{"option1":"fresh data"}');
  expect(await storage.get("option1")).toEqual("initial value");

  // Test if data has been refreshed.
  await storage.refresh();
  expect(await storage.get("option1")).toEqual("fresh data");
});

it("Test element storage fresh data by default", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const storage = new ElementAttributeStorage<Options>(
    false,
    element,
    attribute,
    {
      option1: "default value",
    },
    validators,
  );

  // Test if data is fresh.
  element.setAttribute(attribute, '{"option1":"fresh data"}');
  expect(await storage.get("option1")).toEqual("fresh data");
});

it("Test element storage data has to be an object", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, "1");

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const func1 = async () => {
    const storage = new ElementAttributeStorage<Options>(
      false,
      element,
      attribute,
      {
        option1: "default value",
      },
      validators,
    );
    // Get data to trigger validation.
    await storage.getAll();
  };
  await expect(func1).rejects.toThrow(StorageValidationError);
});

it("Test element storage data validator returned false", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":1}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const func2 = async () => {
    const storage = new ElementAttributeStorage<Options>(
      false,
      element,
      attribute,
      {
        option1: "default value",
      },
      validators,
    );
    // Get data to trigger validation.
    await storage.getAll();
  };
  await expect(func2).rejects.toThrow(StorageValidationError);
});

it("Test ElementStorage custom elementOptions merger", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const storage = new ElementAttributeStorage<Options>(
    false,
    element,
    attribute,
    { option1: "default value" },
    validators,
    {
      elementOptionsMerger: (defaultOptions, elementOptions) => {
        return {
          ...defaultOptions,
          ...elementOptions,
          ...{ option1: "overridden" },
        };
      },
    },
  );

  expect(await storage.get("option1")).toEqual("overridden");
});

it("Test ElementStorage only single option is saved to element when set", () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
    option2?: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"test"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
    option2: (value) => typeof value === "string",
  };

  const option2DefaultValue = "option2 default value";

  const storage = new ElementAttributeStorage<Options>(
    false,
    element,
    attribute,
    {
      option1: "default value",
      option2: option2DefaultValue,
    },
    validators,
  );

  storage.set("option1", "updated");

  expect(element.getAttribute(attribute)).not.toContain(option2DefaultValue);
});

it("Test ElementStorage properly handling default empty options attribute", () => {
  const attribute = "data-test-wraplet";
  type Options = {};

  const element = document.createElement("div");
  element.setAttribute(attribute, "");

  const validators: Record<keyof Options, (value: unknown) => boolean> = {};

  const func = () => {
    new ElementAttributeStorage<Options>(
      false,
      element,
      attribute,
      {},
      validators,
    );
  };

  expect(func).not.toThrow(StorageValidationError);
});

it("Test ElementStorage warns and throws when option has no validator", async () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
    // option2 is intentionally omitted from validators to trigger the branch
    option2?: string;
  };

  const element = document.createElement("div");
  element.setAttribute(
    attribute,
    '{"option1":"ok","option2":"missing validator"}',
  );

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value: unknown) => typeof value === "string",
    // Note: no validator for option2 on purpose
  } as any;

  const func_nonpartial = async () => {
    const storage = new ElementAttributeStorage<Options>(
      false,
      element,
      attribute,
      { option1: "default" },
      validators,
    );
    // Get data to trigger validation.
    await storage.getAll();
  };

  await expect(func_nonpartial).rejects.toThrow(StorageValidationError);
});

it("Test ElementStorage warns and throws when validator is not a function", () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
    option2?: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"ok","option2":"bad validator"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value: unknown) => typeof value === "string",
    // Intentionally set to a non-function.
    option2: "not-a-function",
  } as any;

  const func_invalid_validator = () => {
    new ElementAttributeStorage<Options>(
      false,
      element,
      attribute,
      { option1: "default" },
      validators,
    );
  };

  expect(func_invalid_validator).toThrow(StorageValidationError);
});
