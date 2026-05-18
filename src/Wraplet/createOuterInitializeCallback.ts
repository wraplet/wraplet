import { Status, StatusWritable } from "./types/Status";
import { Wraplet } from "./types/Wraplet";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";
import { LifecycleError } from "../errors";

export type OuterInitializeCallbackArgs = {
  wraplet: Wraplet;
  destroyCallback: () => Promise<void>;
  status: Status;
};

export function createOuterInitializeCallback(
  args: OuterInitializeCallbackArgs,
  initializeLogic?: WrapletApiFactoryBasicCallback,
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

      if (initializeLogic) {
        await initializeLogic();
      }

      status.isInitialized = true;
      status.isGettingInitialized = false;

      // If destruction has been invoked in the meantime, we can finally do it, when initialization
      // is finished.
      if (status.isGettingDestroyed) {
        await args.destroyCallback();
      }
    })().finally(() => {
      promise = null;
    });

    return promise;
  };
}
