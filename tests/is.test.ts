import "./setup";

import { is } from "../src/utils/is";

// Type guards using the shared `is` helper
import {
  DependencyManagerSymbol,
  isDependencyManager,
} from "../src/DependencyManager/types/DependencyManager";
import { isWraplet } from "../src";
import { WrapletSetSymbol, isWrapletSet } from "../src/Set/types/WrapletSet";
import { WrapletApiSymbol } from "../src/Wraplet/types/WrapletApi";

describe("utils/is and related type guards (positive cases)", () => {
  it("is() returns true for an object tagged with the given symbol", () => {
    const SomeSymbol = Symbol("SomeSymbol");
    const obj: unknown = { [SomeSymbol]: true };

    expect(is(obj, SomeSymbol)).toBe(true);
  });

  it("isDependencyManager returns true when object has DependencyManagerSymbol", () => {
    const obj: unknown = { [DependencyManagerSymbol]: true };
    expect(isDependencyManager(obj)).toBe(true);
  });

  it("isWraplet returns true when object has 'wraplet' property", () => {
    const obj: unknown = {
      wraplet: {
        [WrapletApiSymbol]: true,
      },
    };
    expect(isWraplet(obj)).toBe(true);
  });

  it("isWrapletSet returns true when object has WrapletSetSymbol", () => {
    const obj: unknown = { [WrapletSetSymbol]: true };
    expect(isWrapletSet(obj)).toBe(true);
  });
});
