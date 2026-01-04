import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { createDefaultInitializeCallback } from "../Wraplet/createDefaultInitializeCallback";
import { createDefaultDestroyCallback } from "../Wraplet/createDefaultDestroyCallback";
import { Wraplet } from "../Wraplet/types/Wraplet";

export const createWrapletApi = <N extends Node, M extends WrapletChildrenMap>(
  args: WrapletApiFactoryArgs<N, M>,
): WrapletApi<N> & WrapletApiDebug<N> => {
  const nodeAccessors: ((node: N) => void)[] = [];

  const api: Partial<WrapletApi<N> & WrapletApiDebug<N>> = {};

  const destroyListeners = args.destroyListeners || [];

  const destroyCallback =
    args.destroyCallback ||
    createDefaultDestroyCallback({
      core: args.core,
      wraplet: args.wraplet,
      destroyListeners: destroyListeners,
    }).bind(api);

  api.destroy = destroyCallback;

  const initializeCallback =
    args.initializeCallback ||
    createDefaultInitializeCallback({
      core: args.core,
      destroyCallback: api.destroy,
    }).bind(api);

  return Object.assign(api, {
    __nodeAccessors: nodeAccessors,
    status: {
      isGettingInitialized: false,
      isDestroyed: false,
      isInitialized: false,
      isGettingDestroyed: false,
    },
    addDestroyListener: (callback: DestroyListener<Wraplet<N>>) => {
      destroyListeners.push(callback);
    },

    initialize: initializeCallback,

    destroy: destroyCallback,

    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(args.core.node);
    },
  });
};
