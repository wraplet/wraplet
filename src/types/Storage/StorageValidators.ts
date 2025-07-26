export type StorageValidators<T extends Record<string, unknown>> = Record<
  keyof T,
  StorageValidator
>;

export type StorageValidator = (value: unknown) => boolean;
