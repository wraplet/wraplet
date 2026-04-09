import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import { NodelessWrapletApiFactoryArgs } from "./types/NodelessWrapletApiFactoryArgs";
import {
  NodelessWrapletApi,
  NodelessWrapletApiDebug,
  NodelessWrapletApiSymbol,
} from "./types/NodelessWrapletApi";
import { createOuterInitializeCallback } from "./createOuterInitializeCallback";
import { createOuterDestroyCallback } from "./createOuterDestroyCallback";
import { isAnyWraplet } from "./types/Wraplet";

function validateNodelessWrapletApiFactoryArgs(
  args: NodelessWrapletApiFactoryArgs,
): void {
  if (!isAnyWraplet(args.wraplet)) {
    throw new Error("Correct wraplet instance has to be provided.");
  }

  if (
    args.initializeCallback &&
    typeof args.initializeCallback !== "function"
  ) {
    throw new Error("initializeCallback has to be a function.");
  }

  if (args.destroyCallback && typeof args.destroyCallback !== "function") {
    throw new Error("destroyCallback has to be a function.");
  }
}

export const createNodelessWrapletApi = (
  args: NodelessWrapletApiFactoryArgs,
): NodelessWrapletApi & NodelessWrapletApiDebug => {
  validateNodelessWrapletApiFactoryArgs(args);

  const defaultStatus = {
    isGettingInitialized: false,
    isDestroyed: false,
    isInitialized: false,
    isGettingDestroyed: false,
  };

  const api: Partial<NodelessWrapletApi & NodelessWrapletApiDebug> = {};

  const destroyListeners: DestroyListener[] = [];

  const destroyCallback = createOuterDestroyCallback(
    {
      status: defaultStatus,
      wraplet: args.wraplet,
      destroyListeners: destroyListeners,
    },
    async () => {
      if (args.destroyCallback) {
        await args.destroyCallback();
      }
    },
  ).bind(api);

  const initializeCallback = createOuterInitializeCallback(
    {
      status: defaultStatus,
      destroyCallback: destroyCallback,
      wraplet: args.wraplet,
    },
    async () => {
      if (args.initializeCallback) {
        await args.initializeCallback();
      }
    },
  ).bind(api);

  return Object.assign(api, {
    [NodelessWrapletApiSymbol]: true,
    __destroyListeners: destroyListeners,
    status: defaultStatus,
    addDestroyListener: (callback: DestroyListener) => {
      destroyListeners.push(callback);
    },

    initialize: initializeCallback,

    destroy: destroyCallback,
  });
};
