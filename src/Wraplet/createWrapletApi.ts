import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { createDefaultInitializeCallback } from "../Wraplet/createDefaultInitializeCallback";
import { createDefaultDestroyCallback } from "../Wraplet/createDefaultDestroyCallback";
import { Wraplet } from "../Wraplet/types/Wraplet";

export const createWrapletApi = <
  N extends Node,
  M extends WrapletDependencyMap,
>(
  args: WrapletApiFactoryArgs<N, M>,
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

  const destroyCallback =
    args.destroyOuterCallback ||
    createDefaultDestroyCallback(
      {
        core: args.core,
        wraplet: args.wraplet,
        destroyListeners: destroyListeners,
      },
      args.destroyCallback,
    ).bind(api);

  const initializeCallback =
    args.initializeOuterCallback ||
    createDefaultInitializeCallback(
      {
        core: args.core,
        destroyCallback: destroyCallback,
        wraplet: args.wraplet,
      },
      args.initializeCallback,
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
      callback(args.core.node);
    },
  });
};
