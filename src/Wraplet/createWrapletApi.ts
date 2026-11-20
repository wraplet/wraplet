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
import { LifecycleListener } from "./types/LifecycleListener";
import { createOuterDestroyCallback } from "./createOuterDestroyCallback";
import { createOuterInitializeCallback } from "./createOuterInitializeCallback";

function validateNodeWrapletApiFactoryArgs<N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): void {
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

  const initializeListeners: LifecycleListener[] = [];
  const destroyListeners: LifecycleListener[] = [];
  const destroyedListeners: LifecycleListener[] = [];

  if (newArgs.initializeCallback) {
    initializeListeners.push(newArgs.initializeCallback);
  }

  const node = newArgs.node;
  if (node) {
    destroyListeners.push(async () => {
      removeWrapletFromNode(newArgs.wraplet, node);
    });
  }

  if (newArgs.destroyCallback) {
    destroyListeners.push(newArgs.destroyCallback);
  }

  const destroyCallback = createOuterDestroyCallback({
    status: defaultStatus,
    wraplet: newArgs.wraplet,
    initializeListeners: initializeListeners,
    destroyListeners: destroyListeners,
    destroyedListeners: destroyedListeners,
  }).bind(api);

  const initializeCallback = createOuterInitializeCallback({
    status: defaultStatus,
    wraplet: newArgs.wraplet,
    destroyCallback: destroyCallback,
    initializeListeners: initializeListeners,
  }).bind(api);

  // Note that it's added immediately without initialization required.
  if (newArgs.node) {
    addWrapletToNode(newArgs.wraplet, newArgs.node);
  }

  return Object.assign(api, {
    [WrapletApiSymbol]: true as const,
    __initializeListeners: initializeListeners,
    __destroyListeners: destroyListeners,
    status: defaultStatus,

    onInitialize: (callback: LifecycleListener) => {
      initializeListeners.push(callback);
    },

    onDestroy: (callback: LifecycleListener) => {
      destroyListeners.push(callback);
    },

    onAfterDestroy: (callback: LifecycleListener) => {
      destroyedListeners.push(callback);
    },

    initialize: initializeCallback,

    destroy: destroyCallback,
  } satisfies WrapletApi & WrapletApiDebug);
};
