import { isWrapletChildrenMap } from "../../src/Wraplet/types/WrapletChildrenMap";

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

  it("should return true for a valid WrapletChildrenMap", () => {
    expect(
      isWrapletChildrenMap({
        child1: { selector: ".test" },
        child2: {
          selector: ".test2",
          Class: class {},
          multiple: true,
          required: false,
          destructible: true,
          coreOptions: {},
          map: {},
          args: [],
        },
      }),
    ).toBe(true);
  });

  it("should return true for an empty object", () => {
    expect(isWrapletChildrenMap({})).toBe(true);
  });
});
