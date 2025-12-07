import { StorageReadonly } from "./StorageReadonly";

export interface Storage<
  D extends Record<string, unknown>,
> extends StorageReadonly<D> {
  set: <T extends keyof D>(key: T, value: D[T]) => void;
  setMultiple: (data: Partial<D>) => void;
  setAll: (data: D) => void;
  delete: (key: keyof D) => void;
  deleteMultiple: (keys: (keyof D)[]) => void;
  deleteAll: () => void;
}
