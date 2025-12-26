import { StatusWritable } from "./types/Status";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";
import { Core } from "../Core/types/Core";
import { Wraplet } from "./types/Wraplet";
import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletChildrenMap } from "./types/WrapletChildrenMap";

export default function createDefaultDestroyWrapper<
  N extends Node,
  M extends WrapletChildrenMap,
>(
  status: StatusWritable,
  core: Core<N, M>,
  wraplet: Wraplet<N>,
  destroyListeners: DestroyListener<N>[],
  destroyCallback?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async () => {
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
      status.isDestroyed = true;
      status.isGettingDestroyed = false;
      return;
    }

    await core.destroy();
    for (const listener of destroyListeners) {
      await listener(wraplet);
    }

    if (destroyCallback) {
      await destroyCallback();
    }

    status.isGettingDestroyed = false;
    status.isInitialized = false;
    status.isDestroyed = true;
  };
}
