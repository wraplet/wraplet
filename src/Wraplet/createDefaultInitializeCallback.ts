import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { Status } from "./types/Status";
import { Core } from "../Core/types/Core";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";
import {
  initializationCompleted,
  initializationStarted,
} from "../Wraplet/statusActions";

export type DefaultInitializeCallbackArgs<
  N extends Node,
  M extends WrapletChildrenMap,
> = {
  core: Core<N, M>;
  destroyCallback: () => Promise<void>;
  status?: Status;
};

/**
 * Note: If status is not provided, this function will attempt to get it from "this".
 */
export function createDefaultInitializeCallback<
  N extends Node,
  M extends WrapletChildrenMap,
>(
  args: DefaultInitializeCallbackArgs<N, M>,
  customInitializeLogic?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async function () {
    // @ts-expect-error "this" is a fallback if status is not provided.
    if (!args.status && (!this || !this.status)) {
      throw new Error("Cannot initialize without status available.");
    }
    // @ts-expect-error "this" is a fallback if status is not provided.
    const outerStatus: Status = args.status || this.status;
    if (!(await initializationStarted(outerStatus, args.core))) {
      return;
    }

    if (customInitializeLogic) {
      await customInitializeLogic();
    }

    await initializationCompleted(outerStatus, args.destroyCallback);
  };
}
