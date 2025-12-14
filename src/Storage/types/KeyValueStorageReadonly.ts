export type KeyValueStorageReadonly<D extends Record<string, unknown>> = {
  get: <T extends keyof D>(key: T) => Promise<D[T]>;
  getMultiple: <T extends keyof D>(keys: T[]) => Promise<Pick<D, T>>;
  getAll: () => Promise<D>;
  has: (key: keyof D) => Promise<boolean>;
};
