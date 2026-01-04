import { Status } from "./types/Status";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";
import { Core } from "../Core/types/Core";
import { Wraplet } from "./types/Wraplet";
import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import {
  destructionCompleted,
  destructionStarted,
} from "../Wraplet/statusActions";

export function createDefaultDestroyCallback<
  N extends Node,
  M extends WrapletChildrenMap,
>(
  core: Core<N, M>,
  wraplet: Wraplet<N>,
  destroyListeners: DestroyListener<Wraplet<N>>[],
  customDestroyLogic?: WrapletApiFactoryBasicCallback,
  status?: Status,
): () => Promise<void> {
  return async function () {
    // @ts-expect-error "this" is a fallback if status is not provided.
    if (!status && (!this || !this.status)) {
      throw new Error("Cannot destroy without status available.");
    }

    // @ts-expect-error Default callbacks depend on the status from the outer object for the easier usage.
    const outerStatus: Status = status || this.status;
    if (
      !(await destructionStarted(outerStatus, core, wraplet, destroyListeners))
    ) {
      return;
    }

    if (customDestroyLogic) {
      await customDestroyLogic();
    }

    await destructionCompleted(outerStatus);
  };
}
