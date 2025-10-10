import "./setup";
import { ElementStorage } from "../src/storage";
import { StorageValidationError } from "../src/errors";

it("Test element storage", () => {
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

  const storage = new ElementStorage<Options>(
    element,
    attribute,
    { option1: "default value" },
    validators,
    { keepFresh: true },
  );

  // Test if the value was correctly fetched from the attribute.
  expect(storage.has("option1")).toEqual(true);
  expect(storage.get("option1")).toEqual("initial value");

  // Test setAll.
  storage.setAll({ option1: "new value", option2: false });
  expect(storage.getAll()).toEqual({ option1: "new value", option2: false });

  // Test if the new value is available.
  storage.set("option1", "new value");
  expect(storage.get("option1")).toEqual("new value");

  // Test delete.
  storage.delete("option1");
  expect(storage.get("option1")).toEqual("default value");

  // Test delete non-existing without errors.
  // @ts-expect-error We are testing a non-existing key.
  storage.delete("test");

  // Test deleteAll.
  storage.set("option1", "new value");
  storage.deleteAll();
  expect(storage.getAll()).toEqual({ option1: "default value" });

  // Test if the attribute's value has been updated.
  storage.setAll({ option1: "new value" });
  expect(element.getAttribute(attribute)).toEqual('{"option1":"new value"}');
  storage.deleteAll();
  expect(element.hasAttribute(attribute)).toBe(false);

  // Test if the default value is still available.
  expect(storage.get("option1")).toEqual("default value");

  // Test validators.
  const validatorTrigger = () => {
    storage.set("option1", false as any);
  };
  expect(validatorTrigger).toThrow();

  // Test getMultiple.
  storage.deleteAll();
  storage.set("option1", "some value");
  storage.set("option2", true);
  expect(storage.getMultiple(["option1"])).toEqual({
    option1: "some value",
  });

  // Test deleteAll.
  storage.setAll({
    option1: "some value",
    option2: true,
  });
  storage.deleteAll();
  expect(storage.getAll()).toEqual({ option1: "default value" });

  // Test setMultiple.
  storage.deleteAll();
  storage.setMultiple({
    option1: "some value",
    option2: true,
    option3: "some other value",
  });
  expect(storage.getAll()).toEqual({
    option1: "some value",
    option2: true,
    option3: "some other value",
  });

  // Test deleteMultiple.
  storage.setAll({
    option1: "some value",
    option2: true,
    option3: "some other value",
  });
  storage.deleteMultiple(["option1", "option2"]);
  expect(storage.getAll()).toEqual({
    option1: "default value",
    option3: "some other value",
  });
});

it("Test element storage fresh data", () => {
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

  const storage = new ElementStorage<Options>(
    element,
    attribute,
    { option1: "default value" },
    validators,
    { keepFresh: true },
  );

  // Test the freshness of data.
  element.setAttribute(attribute, '{"option1":"fresh data"}');
  expect(storage.get("option1")).toEqual("fresh data");
});

it("Test element storage non-fresh data", () => {
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

  const storage = new ElementStorage<Options>(
    element,
    attribute,
    { option1: "default value" },
    validators,
    { keepFresh: false },
  );

  // Test if data is indeed not fresh.
  element.setAttribute(attribute, '{"option1":"fresh data"}');
  expect(storage.get("option1")).toEqual("initial value");

  // Test if data has been refreshed.
  storage.refresh();
  expect(storage.get("option1")).toEqual("fresh data");
});

it("Test element storage fresh data by default", () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const storage = new ElementStorage<Options>(
    element,
    attribute,
    {
      option1: "default value",
    },
    validators,
  );

  // Test if data is fresh.
  element.setAttribute(attribute, '{"option1":"fresh data"}');
  expect(storage.get("option1")).toEqual("fresh data");
});

it("Test element storage data has to be an object", () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, "1");

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const func = () => {
    new ElementStorage<Options>(
      element,
      attribute,
      {
        option1: "default value",
      },
      validators,
    );
  };
  expect(func).toThrow(StorageValidationError);
});

it("Test element storage data validator returned false", () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":1}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const func = () => {
    new ElementStorage<Options>(
      element,
      attribute,
      {
        option1: "default value",
      },
      validators,
    );
  };
  expect(func).toThrow(StorageValidationError);
});

it("Test ElementStorage custom elementOptions merger", () => {
  const attribute = "data-test-wraplet";
  type Options = {
    option1: string;
  };

  const element = document.createElement("div");
  element.setAttribute(attribute, '{"option1":"initial value"}');

  const validators: Record<keyof Options, (value: unknown) => boolean> = {
    option1: (value) => typeof value === "string",
  };

  const storage = new ElementStorage<Options>(
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

  expect(storage.get("option1")).toEqual("overridden");
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

  const storage = new ElementStorage<Options>(
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
    new ElementStorage<Options>(element, attribute, {}, validators);
  };

  expect(func).not.toThrow(StorageValidationError);
});
