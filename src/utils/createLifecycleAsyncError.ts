import { LifecycleAsyncErrors } from "../errors";

export function createLifecycleAsyncError(
  message: string,
  results: PromiseSettledResult<any>[],
  throwError: boolean = true,
): LifecycleAsyncErrors | null {
  const error = new LifecycleAsyncErrors(message);

  for (const result of results) {
    if (result.status === "rejected") {
      error.errors.push(result.reason);
    }
  }

  if (error.errors.length === 0) {
    return null;
  }

  if (throwError) {
    throw error;
  }

  return error;
}
