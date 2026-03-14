import { LifecycleError } from "../errors";
import { AsyncResultsLifecycleData } from "./types/AsyncResultsLifecycleData";

export function handleAsyncLifecycleResults(
  at: string,
  results: AsyncResultsLifecycleData[],
) {
  const errorResults: AsyncResultsLifecycleData[] = [];

  for (const item of results) {
    const child = item.child;
    const rejected = item.results.filter(
      (result) => result.status === "rejected",
    );

    if (rejected.length > 0) {
      errorResults.push({ child, results: rejected });
    }
  }

  if (errorResults.length > 0) {
    throw new LifecycleError(`Async errors at ${at}`, {
      cause: errorResults,
    });
  }
}
