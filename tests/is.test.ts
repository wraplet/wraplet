import "./setup";

import { is } from "../src/utils/is";

// Type guards using the shared `is` helper
import { CoreSymbol, isCore } from "../src/Core/types/Core";
import { WrapletSymbol, isWraplet } from "../src/Core/types/Wraplet";
import { ArgCreatorSymbol, isArgCreator } from "../src/Core/types/ArgCreator";
import { DynamicMapSymbol, isDynamicMap } from "../src/Map/types/DynamicMap";
import { WrapletSetSymbol, isWrapletSet } from "../src/Set/types/WrapletSet";
import { KeyValueStorageSymbol, isKeyValueStorage } from "../src/storage";
import { GroupableSymbol, isGroupable } from "../src/types/Groupable";

describe("utils/is and related type guards (positive cases)", () => {
  it("is() returns true for an object tagged with the given symbol", () => {
    const SomeSymbol = Symbol("SomeSymbol");
    const obj: unknown = { [SomeSymbol]: true };

    expect(is(obj, SomeSymbol)).toBe(true);
  });

  it("isCore returns true when object has CoreSymbol", () => {
    const obj: unknown = { [CoreSymbol]: true };
    expect(isCore(obj)).toBe(true);
  });

  it("isWraplet returns true when object has WrapletSymbol", () => {
    const obj: unknown = { [WrapletSymbol]: true };
    expect(isWraplet(obj)).toBe(true);
  });

  it("isArgCreator returns true when object has ArgCreatorSymbol", () => {
    const obj: unknown = { [ArgCreatorSymbol]: true, createArg: jest.fn() };
    expect(isArgCreator(obj)).toBe(true);
  });

  it("isDynamicMap returns true when object has DynamicMapSymbol", () => {
    const obj: unknown = { [DynamicMapSymbol]: true, create: jest.fn() };
    expect(isDynamicMap(obj)).toBe(true);
  });

  it("isWrapletSet returns true when object has WrapletSetSymbol", () => {
    const obj: unknown = { [WrapletSetSymbol]: true };
    expect(isWrapletSet(obj)).toBe(true);
  });

  it("isKeyValueStorage returns true when object has KeyValueStorageSymbol", () => {
    const obj: unknown = { [KeyValueStorageSymbol]: true };
    expect(isKeyValueStorage(obj)).toBe(true);
  });

  it("isGroupable returns true when object has GroupableSymbol", () => {
    const obj: unknown = { [GroupableSymbol]: true };
    expect(isGroupable(obj)).toBe(true);
  });
});
