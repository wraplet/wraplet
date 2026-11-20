import { Status, StatusWritable } from "./types/Status";
import { Wraplet } from "./types/Wraplet";
import { LifecycleError } from "../errors";
import { LifecycleListener } from "./types/LifecycleListener";

export type OuterInitializeCallbackArgs = {
  wraplet: Wraplet;
  status: Status;
  destroyCallback: LifecycleListener;
  initializeListeners: LifecycleListener[];
};

export function createOuterInitializeCallback(
  args: OuterInitializeCallbackArgs,
): () => Promise<void> {
  let promise: Promise<void> | null = null;
  return function () {
    if (promise) {
      return promise;
    }

    promise = (async () => {
      const status: StatusWritable = args.status;
      if (status.isDestroyed || status.isGettingDestroyed) {
        throw new LifecycleError(
          "Wraplet cannot be initialized when destroyed or in the process of being destroyed",
        );
      }

      if (status.isInitialized || status.isGettingInitialized) {
        return;
      }

      status.isGettingInitialized = true;

      for (const listener of args.initializeListeners) {
        await listener(args.wraplet);
      }

      status.isInitialized = true;
      status.isGettingInitialized = false;
      // If destruction has been invoked in the meantime, we can finally do it, when initialization
      // is finished.
      if (status.isGettingDestroyed) {
        await args.destroyCallback(args.wraplet);
      }
    })().finally(() => {
      promise = null;
    });

    return promise;
  };
}
