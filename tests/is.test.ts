import "./setup";

import { is } from "../src/utils/is";

// Type guards using the shared `is` helper
import {
  DependencyManagerSymbol,
  isDependencyManager,
} from "../src/DependencyManager/types/DependencyManager";
import { WrapletSymbol, isWraplet } from "../src/Wraplet/types/Wraplet";
import { WrapletSetSymbol, isWrapletSet } from "../src/Set/types/WrapletSet";
import { KeyValueStorageSymbol, isKeyValueStorage } from "../src/storage";

describe("utils/is and related type guards (positive cases)", () => {
  it("is() returns true for an object tagged with the given symbol", () => {
    const SomeSymbol = Symbol("SomeSymbol");
    const obj: unknown = { [SomeSymbol]: true };

    expect(is(obj, SomeSymbol)).toBe(true);
  });

  it("isCore returns true when object has CoreSymbol", () => {
    const obj: unknown = { [DependencyManagerSymbol]: true };
    expect(isDependencyManager(obj)).toBe(true);
  });

  it("isWraplet returns true when object has WrapletSymbol", () => {
    const obj: unknown = { [WrapletSymbol]: true };
    expect(isWraplet(obj)).toBe(true);
  });

  it("isWrapletSet returns true when object has WrapletSetSymbol", () => {
    const obj: unknown = { [WrapletSetSymbol]: true };
    expect(isWrapletSet(obj)).toBe(true);
  });

  it("isKeyValueStorage returns true when object has KeyValueStorageSymbol", () => {
    const obj: unknown = { [KeyValueStorageSymbol]: true };
    expect(isKeyValueStorage(obj)).toBe(true);
  });
});
