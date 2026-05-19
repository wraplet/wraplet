export const RESOLVE = Promise.resolve();

export function throwIfErrors(errors: Error[], message: string): void {
  if (errors.length === 0) return;
  throw new AggregateError(errors, `${message}`);
}
