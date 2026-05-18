import { Status, StatusWritable } from "./types/Status";
import { Wraplet } from "./types/Wraplet";
import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";
import { LifecycleError } from "../errors";

export type OuterDestroyCallbackArgs = {
  wraplet: Wraplet;
  destroyListeners: DestroyListener[];
  status: Status;
};

export function createOuterDestroyCallback(
  args: OuterDestroyCallbackArgs,
  destroyLogic?: WrapletApiFactoryBasicCallback,
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

      if (destroyLogic) {
        await destroyLogic();
      }

      status.isGettingDestroyed = false;
      status.isInitialized = false;
      status.isDestroyed = true;

      for (const listener of [...args.destroyListeners].reverse()) {
        await listener(args.wraplet);
      }

      args.destroyListeners.length = 0;
    })().finally(() => {
      promise = null;
    });

    return promise;
  };
}
