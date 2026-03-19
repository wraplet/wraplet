import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { createOuterInitializeCallback } from "./createOuterInitializeCallback";
import { createOuterDestroyCallback } from "./createOuterDestroyCallback";
import { isWraplet, Wraplet } from "./types/Wraplet";
import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../NodeTreeManager/utils";

function validateWrapletApiFactoryArgs<N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): void {
  if (!isWraplet(args.wraplet)) {
    throw new Error("Correct wraplet instance has to be provided.");
  }

  if (!(args.node instanceof Node)) {
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

export const createWrapletApi = <N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): WrapletApi<N> & WrapletApiDebug<N> => {
  validateWrapletApiFactoryArgs(args);

  const nodeAccessors: ((node: N) => void)[] = [];

  const defaultStatus = {
    isGettingInitialized: false,
    isDestroyed: false,
    isInitialized: false,
    isGettingDestroyed: false,
  };

  const api: Partial<WrapletApi<N> & WrapletApiDebug<N>> = {};

  const destroyListeners: DestroyListener<Wraplet<N>>[] = [];

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
      removeWrapletFromNode(args.wraplet, args.node);
    },
  ).bind(api);

  const initializeCallback = createOuterInitializeCallback(
    {
      status: defaultStatus,
      destroyCallback: destroyCallback,
      wraplet: args.wraplet,
    },
    async () => {
      addWrapletToNode(args.wraplet, args.node);
      if (args.initializeCallback) {
        await args.initializeCallback();
      }
    },
  ).bind(api);

  return Object.assign(api, {
    __nodeAccessors: nodeAccessors,
    __destroyListeners: destroyListeners,
    status: defaultStatus,
    addDestroyListener: (callback: DestroyListener<Wraplet<N>>) => {
      destroyListeners.push(callback);
    },

    initialize: initializeCallback,

    destroy: async () => {
      await destroyCallback();
      nodeAccessors.length = 0;
    },

    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(args.node);
    },
  });
};
