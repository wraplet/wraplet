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
