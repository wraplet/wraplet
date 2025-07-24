export type StorageReadonly<D extends Record<string, unknown>> = {
  get: <T extends keyof D>(key: T) => D[T];
  getMultiple: <T extends keyof D>(keys: T[]) => Pick<D, T>;
  getAll: () => D;
  has: (key: keyof D) => boolean;
};
