export type ElementOptionsMerger<D extends Record<string, unknown>> = (
  defaults: D,
  elementOptions: Partial<D>,
) => D;
