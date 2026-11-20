import { Status, StatusWritable } from "./types/Status";
import { Wraplet } from "./types/Wraplet";
import { LifecycleListener } from "./types/LifecycleListener";
import { LifecycleError } from "../errors";
import { throwIfErrors } from "../utils/utils";

export type OuterDestroyCallbackArgs = {
  wraplet: Wraplet;
  destroyListeners: LifecycleListener[];
  destroyedListeners: LifecycleListener[];
  initializeListeners: LifecycleListener[];
  status: Status;
};

export function createOuterDestroyCallback(
  args: OuterDestroyCallbackArgs,
): () => Promise<void> {
  let promise: Promise<void> | null = null;
  return function () {
    if (promise) {
      return promise;
    }

    promise = (async () => {
      const status: StatusWritable = args.status;

      if (status.isDestroyed) {
        return;
      }
      status.isGettingDestroyed = true;
      if (status.isGettingInitialized) {
        // If we are still initializing, then postpone destruction until after
        // initialization is finished.
        // We are leaving this method, but with `isGettingDestroyed` set to true, so
        // the initialization process will know to return here after it will finish.
        return;
      }

      if (!status.isInitialized) {
        // If we are not initialized, then we have nothing to do here.
        throw new LifecycleError(
          "Wraplet cannot be destroyed before it is initialized.",
        );
      }

      const destroyErrors: Error[] = [];

      for (const listener of [...args.destroyListeners].reverse()) {
        try {
          await listener(args.wraplet);
        } catch (error) {
          destroyErrors.push(error as Error);
        }
      }

      args.destroyListeners.length = 0;
      args.initializeListeners.length = 0;

      status.isGettingDestroyed = false;
      status.isInitialized = false;
      status.isDestroyed = true;

      const afterDestroyErrors: Error[] = [];
      for (const listener of [...args.destroyedListeners].reverse()) {
        try {
          await listener(args.wraplet);
        } catch (error) {
          afterDestroyErrors.push(error as Error);
        }
      }

      const errors: Error[] = [];

      if (destroyErrors.length > 0) {
        errors.push(
          new AggregateError(destroyErrors, "Errors in destroy listeners."),
        );
      }

      if (afterDestroyErrors.length > 0) {
        errors.push(
          new AggregateError(
            afterDestroyErrors,
            "Errors in after-destroy listeners.",
          ),
        );
      }

      throwIfErrors(errors, "Errors during wraplet destruction.");
    })().finally(() => {
      promise = null;
    });

    return promise;
  };
}
