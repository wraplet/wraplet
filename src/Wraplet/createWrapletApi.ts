import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { createOuterInitializeCallback } from "./createOuterInitializeCallback";
import { createOuterDestroyCallback } from "./createOuterDestroyCallback";
import { Wraplet } from "../Wraplet/types/Wraplet";
import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../NodeTreeManager/utils";

export const createWrapletApi = <N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): WrapletApi<N> & WrapletApiDebug<N> => {
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
        removeWrapletFromNode(args.wraplet, args.node);
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
        addWrapletToNode(args.wraplet, args.node);
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

    destroy: destroyCallback,

    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(args.node);
    },
  });
};
