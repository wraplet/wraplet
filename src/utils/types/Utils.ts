export type Constructable<T> = { new (...args: any[]): T };

export type InstantiableReturnType<T> = T extends {
  new (...args: any[]): infer R;
}
  ? R
  : never;

export type Nullable<T> = { [K in keyof T]: T[K] | null };
