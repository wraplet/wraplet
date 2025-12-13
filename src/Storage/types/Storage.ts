import { StorageReadonly } from "./StorageReadonly";

export interface Storage<
  D extends Record<string, unknown>,
> extends StorageReadonly<D> {
  set: <T extends keyof D>(key: T, value: D[T]) => Promise<void>;
  setMultiple: (data: Partial<D>) => Promise<void>;
  setAll: (data: D) => Promise<void>;
  delete: (key: keyof D) => Promise<void>;
  deleteMultiple: (keys: (keyof D)[]) => Promise<void>;
  deleteAll: () => Promise<void>;
}
