export type AsyncResultsLifecycleData = {
  results: PromiseSettledResult<void>[];
  child?: string;
};
