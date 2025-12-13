export type StorageDefaults<D extends Record<string, unknown>> = Record<
  keyof D,
  Exclude<D[keyof D], undefined>
>;
