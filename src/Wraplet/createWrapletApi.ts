import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../NodeTreeManager/utils";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import {
  WrapletApi,
  WrapletApiDebug,
  WrapletApiSymbol,
} from "./types/WrapletApi";
import { isWraplet } from "./types/Wraplet";
import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import { createOuterDestroyCallback } from "./createOuterDestroyCallback";
import { createOuterInitializeCallback } from "./createOuterInitializeCallback";

function validateNodeWrapletApiFactoryArgs<N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): void {
  if (!isWraplet(args.wraplet)) {
    throw new Error("Correct wraplet instance has to be provided.");
  }

  if (args.node && !(args.node instanceof Node)) {
    throw new Error("Correct node has to be provided.");
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

export const createWrapletApi = (
  args: WrapletApiFactoryArgs,
): WrapletApi & WrapletApiDebug => {
  validateNodeWrapletApiFactoryArgs(args);

  const newArgs = { ...args };

  const defaultStatus = {
    isGettingInitialized: false,
    isDestroyed: false,
    isInitialized: false,
    isGettingDestroyed: false,
  };

  const api: Partial<WrapletApi & WrapletApiDebug> = {};

  const destroyListeners: DestroyListener[] = [];

  const destroyCallback = createOuterDestroyCallback(
    {
      status: defaultStatus,
      wraplet: newArgs.wraplet,
      destroyListeners: destroyListeners,
    },
    async () => {
      if (newArgs.destroyCallback) {
        await newArgs.destroyCallback();
      }
      if (newArgs.node) {
        removeWrapletFromNode(newArgs.wraplet, newArgs.node);
      }
    },
  ).bind(api);

  const initializeCallback = createOuterInitializeCallback(
    {
      status: defaultStatus,
      destroyCallback: destroyCallback,
      wraplet: newArgs.wraplet,
    },
    async () => {
      if (newArgs.initializeCallback) {
        await newArgs.initializeCallback();
      }
    },
  ).bind(api);

  // Note that it's added immediately without initialization required.
  if (newArgs.node) {
    addWrapletToNode(newArgs.wraplet, newArgs.node);
  }

  return Object.assign(api, {
    [WrapletApiSymbol]: true as const,
    __destroyListeners: destroyListeners,
    status: defaultStatus,
    addDestroyListener: (callback: DestroyListener) => {
      destroyListeners.push(callback);
    },

    initialize: initializeCallback,

    destroy: destroyCallback,
  });
};
