import { Status } from "./types/Status";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";
import {
  initializationCompleted,
  initializationStarted,
} from "../Wraplet/statusActions";
import { Wraplet } from "./types/Wraplet";

export type OuterInitializeCallbackArgs<N extends Node> = {
  wraplet: Wraplet<N>;
  destroyCallback: () => Promise<void>;
  status: Status;
};

export function createOuterInitializeCallback<N extends Node>(
  args: OuterInitializeCallbackArgs<N>,
  initializeLogic?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async function () {
    const outerStatus: Status = args.status;
    if (!(await initializationStarted(outerStatus))) {
      return;
    }

    if (initializeLogic) {
      await initializeLogic();
    }

    await initializationCompleted(outerStatus, args.destroyCallback);
  };
}
