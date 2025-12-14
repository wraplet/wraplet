import { KeyValueStorageReadonly } from "./KeyValueStorageReadonly";

import { is } from "../../utils/is";

const KeyValueStorageSymbol = Symbol("KeyValueStorage");
export { KeyValueStorageSymbol };

export interface KeyValueStorage<
  D extends Record<string, unknown>,
> extends KeyValueStorageReadonly<D> {
  [KeyValueStorageSymbol]: true;
  set: <T extends keyof D>(key: T, value: D[T]) => Promise<void>;
  setMultiple: (data: Partial<D>) => Promise<void>;
  setAll: (data: D) => Promise<void>;
  delete: (key: keyof D) => Promise<void>;
  deleteMultiple: (keys: (keyof D)[]) => Promise<void>;
  deleteAll: () => Promise<void>;
}

export function isKeyValueStorage<D extends Record<string, unknown>>(
  object: unknown,
): object is KeyValueStorage<D> {
  return is(object, KeyValueStorageSymbol);
}
