import { LifecycleError } from "../errors";
import {
  AsyncResultsLifecycleData,
  AsyncResultsLifecycleErrors,
} from "./types/AsyncResultsLifecycleData";

function formatErrors(
  errors: AsyncResultsLifecycleErrors[],
  level: number = 1,
): string {
  const separator = "=".repeat(level);
  let errorString = "";
  for (const results of errors) {
    const child = results.child;

    errorString +=
      `${separator} ` +
      (child ? `Dependency ${child} errors` : `Errors`) +
      ` ${separator}\n`;

    const errors = results.results;
    for (const error of errors) {
      if (!(error.reason instanceof Error)) {
        throw new Error("Error instance expected.");
      }
      const reason = error.reason;
      errorString += `${reason.stack}\n`;
      if (Array.isArray(reason.cause)) {
        errorString += formatErrors(reason.cause, level + 1);
      }
    }
    errorString += `${separator} End of errors ${separator}\n`;
  }

  return errorString;
}

function logErrors(errors: string) {
  console.error(errors);
}

export function handleAsyncLifecycleResults(
  at: string,
  results: AsyncResultsLifecycleData[],
) {
  const errorResults: AsyncResultsLifecycleErrors[] = [];

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
    logErrors(formatErrors(errorResults));
    throw new LifecycleError(`Async errors at ${at}`, {
      cause: errorResults,
    });
  }
}
