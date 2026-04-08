import {
  isNodelessWrapletApi,
  NodelessWrapletApiSymbol,
} from "../../src/Wraplet/types/NodelessWrapletApi";

describe("isNodelessWrapletApi", () => {
  it("returns false for non-NodelessWrapletApi objects", () => {
    expect(isNodelessWrapletApi(null)).toBe(false);
    expect(isNodelessWrapletApi({})).toBe(false);
    expect(isNodelessWrapletApi("string")).toBe(false);
  });

  it("returns true for objects with NodelessWrapletApiSymbol", () => {
    const obj = { [NodelessWrapletApiSymbol]: true };
    expect(isNodelessWrapletApi(obj)).toBe(true);
  });
});
