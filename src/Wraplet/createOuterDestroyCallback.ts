import { Status } from "./types/Status";
import { Wraplet } from "./types/Wraplet";
import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import {
  destructionCompleted,
  destructionStarted,
} from "../Wraplet/statusActions";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";

export type OuterDestroyCallbackArgs<N extends Node> = {
  wraplet: Wraplet<N>;
  destroyListeners: DestroyListener<Wraplet<N>>[];
  status: Status;
};

export function createOuterDestroyCallback<N extends Node>(
  args: OuterDestroyCallbackArgs<N>,
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
