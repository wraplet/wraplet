export type Constructable<T, F = any> = {
  new (firstArg: F, ...args: any[]): T;
};

export type InstantiableReturnType<T> = T extends {
  new (...args: any[]): infer R;
}
  ? R
  : never;

export type Nullable<T> = { [K in keyof T]: T[K] | null };
