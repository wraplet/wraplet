import { Status } from "./types/Status";
import {
  initializationCompleted,
  initializationStarted,
} from "../Wraplet/statusActions";
import { Dependencies } from "./types/Wraplet";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";

export type OuterInitializeCallbackArgs = {
  wraplet: Dependencies;
  destroyCallback: () => Promise<void>;
  status: Status;
};

export function createOuterInitializeCallback(
  args: OuterInitializeCallbackArgs,
  initializeLogic?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async function () {
    const outerStatus: Status = args.status;
    if (!initializationStarted(outerStatus)) {
      return;
    }

    if (initializeLogic) {
      await initializeLogic();
    }

    await initializationCompleted(outerStatus, args.destroyCallback);
  };
}
