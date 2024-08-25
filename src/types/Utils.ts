export type InstantiableReturnType<T> = T extends {
  new (...args: any[]): infer R;
}
  ? R
  : never;

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepWriteable<T> = {
  -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
