import { Status } from "./types/Status";
import { NodelessWraplet } from "./types/Wraplet";
import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import {
  destructionCompleted,
  destructionStarted,
} from "../Wraplet/statusActions";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";

export type OuterDestroyCallbackArgs = {
  wraplet: NodelessWraplet;
  destroyListeners: DestroyListener[];
  status: Status;
};

export function createOuterDestroyCallback(
  args: OuterDestroyCallbackArgs,
  destroyLogic?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async function () {
    const outerStatus: Status = args.status;
    if (!destructionStarted(outerStatus)) {
      return;
    }

    if (destroyLogic) {
      await destroyLogic();
    }

    await destructionCompleted(
      outerStatus,
      args.wraplet,
      args.destroyListeners,
    );
  };
}
