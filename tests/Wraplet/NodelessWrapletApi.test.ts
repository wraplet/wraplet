import {
  isDependencyApi,
  DependencyApiSymbol,
} from "../../src/Wraplet/types/DependencyApi";

describe("isDependencyApi", () => {
  it("returns false for non-DependencyApi objects", () => {
    expect(isDependencyApi(null)).toBe(false);
    expect(isDependencyApi({})).toBe(false);
    expect(isDependencyApi("string")).toBe(false);
  });

  it("returns true for objects with DependencyApiSymbol", () => {
    const obj = { [DependencyApiSymbol]: true };
    expect(isDependencyApi(obj)).toBe(true);
  });
});
