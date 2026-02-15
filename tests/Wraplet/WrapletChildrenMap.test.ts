import { isWrapletChildrenMap } from "../../src/Wraplet/types/WrapletChildrenMap";
import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "../../src/Wraplet/types/WrapletChildDefinition";

describe("isWrapletChildrenMap", () => {
  it("should return false if input is not a simple object", () => {
    expect(isWrapletChildrenMap(null)).toBe(false);
    expect(isWrapletChildrenMap([])).toBe(false);
    expect(isWrapletChildrenMap(123)).toBe(false);
    expect(isWrapletChildrenMap("string")).toBe(false);
    expect(isWrapletChildrenMap(new Date())).toBe(false);
  });

  it("should return false if one of the properties is not a simple object", () => {
    expect(
      isWrapletChildrenMap({
        child1: { selector: ".test" },
        child2: null,
      }),
    ).toBe(false);
    expect(
      isWrapletChildrenMap({
        child1: [],
      }),
    ).toBe(false);
  });

  it("should return false if a child definition has an unknown key", () => {
    expect(
      isWrapletChildrenMap({
        child1: { selector: ".test", unknownKey: true },
      }),
    ).toBe(false);
  });

  it("should return false if a child definition has an invalid type for a required field", () => {
    expect(
      isWrapletChildrenMap({
        child1: {
          Class: "not a function",
          selector: ".test",
          required: true,
          multiple: false,
        } as any,
      }),
    ).toBe(false);

    expect(
      isWrapletChildrenMap({
        child1: {
          Class: class {},
          selector: ".test",
          required: "not a boolean",
          multiple: false,
        },
      }),
    ).toBe(false);

    expect(
      isWrapletChildrenMap({
        child1: {
          Class: class {},
          selector: ".test",
          required: true,
          multiple: "not a boolean",
        },
      }),
    ).toBe(false);
  });

  it("should return true for a valid WrapletChildrenMap", () => {
    expect(
      isWrapletChildrenMap({
        // Minimal child definition
        child1: {
          Class: class {} as any,
          selector: ".test",
          required: false,
          multiple: false,
        } satisfies WrapletChildDefinition,
        // Full child definition
        child2: {
          selector: ".test2",
          Class: class {} as any,
          multiple: true,
          required: false,
          destructible: true,
          coreOptions: {},
          map: {},
          args: [],
        } satisfies WrapletChildDefinitionWithDefaults,
      }),
    ).toBe(true);
  });

  it("should return true for an empty object", () => {
    expect(isWrapletChildrenMap({})).toBe(true);
  });
});
