import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { StatusWritable } from "./types/Status";
import { Core } from "../Core/types/Core";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";

export default function createDefaultInitializeWrapper<
  N extends Node,
  M extends WrapletChildrenMap,
>(
  status: StatusWritable,
  core: Core<N, M>,
  destroyMethod: () => Promise<void>,
  initializeCallback?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async () => {
    if (status.isInitialized) {
      return;
    }
    status.isGettingInitialized = true;

    await core.initialize();

    if (initializeCallback) {
      await initializeCallback();
    }

    status.isInitialized = true;
    status.isGettingInitialized = false;

    // If destruction has been invoked in the meantime, we can finally do it, when initialization
    // is finished.
    if (status.isGettingDestroyed) {
      await destroyMethod();
    }
  };
}
