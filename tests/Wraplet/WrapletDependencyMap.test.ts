import { isWrapletDependencyMap } from "../../src/Wraplet/types/WrapletDependencyMap";
import {
  WrapletDependencyDefinition,
  WrapletDependencyDefinitionWithDefaults,
} from "../../src/Wraplet/types/WrapletDependencyDefinition";

describe("isWrapletChildrenMap", () => {
  it("should return false if input is not a simple object", () => {
    expect(isWrapletDependencyMap(null)).toBe(false);
    expect(isWrapletDependencyMap([])).toBe(false);
    expect(isWrapletDependencyMap(123)).toBe(false);
    expect(isWrapletDependencyMap("string")).toBe(false);
    expect(isWrapletDependencyMap(new Date())).toBe(false);
  });

  it("should return false if one of the properties is not a simple object", () => {
    expect(
      isWrapletDependencyMap({
        child1: { selector: ".test" },
        child2: null,
      }),
    ).toBe(false);
    expect(
      isWrapletDependencyMap({
        child1: [],
      }),
    ).toBe(false);
  });

  it("should return false if a child definition has an unknown key", () => {
    expect(
      isWrapletDependencyMap({
        child1: { selector: ".test", unknownKey: true },
      }),
    ).toBe(false);
  });

  it("should return false if a child definition has an invalid type for a required field", () => {
    expect(
      isWrapletDependencyMap({
        child1: {
          Class: "not a function",
          selector: ".test",
          required: true,
          multiple: false,
        } as any,
      }),
    ).toBe(false);

    expect(
      isWrapletDependencyMap({
        child1: {
          Class: class {},
          selector: ".test",
          required: "not a boolean",
          multiple: false,
        },
      }),
    ).toBe(false);

    expect(
      isWrapletDependencyMap({
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
      isWrapletDependencyMap({
        // Minimal child definition
        child1: {
          Class: class {} as any,
          selector: ".test",
          required: false,
          multiple: false,
        } satisfies WrapletDependencyDefinition,
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
        } satisfies WrapletDependencyDefinitionWithDefaults,
      }),
    ).toBe(true);
  });

  it("should return true for an empty object", () => {
    expect(isWrapletDependencyMap({})).toBe(true);
  });
});
