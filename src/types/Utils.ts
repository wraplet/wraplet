export type InstantiableReturnType<T> = T extends {
  new (...args: any[]): infer R;
}
  ? R
  : never;

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepWriteable<T> = {
  -readonly [P in keyof T]: DeepWriteable<T[P]>;
};

/* istanbul ignore next */
/**
 * Generic guard.
 */
const is = <T extends object>(object: unknown, symbol: symbol): object is T => {
  return (
    typeof object === "object" &&
    object !== null &&
    (object as { [symbol]: unknown })[symbol] === true
  );
};

export { is };
