export type AsyncResultsLifecycleData = {
  results: PromiseSettledResult<void>[];
  child?: string;
};

export type AsyncResultsLifecycleErrors = {
  results: PromiseRejectedResult[];
  child?: string;
};
