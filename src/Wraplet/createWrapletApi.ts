import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { StatusWritable } from "./types/Status";
import { createDefaultDestroyWrapper } from "./createDefaultDestroyWrapper";
import { createDefaultInitializeWrapper } from "./createDefaultInitializeWrapper";

export const createWrapletApi = <N extends Node, M extends WrapletChildrenMap>(
  args: WrapletApiFactoryArgs<N, M>,
): WrapletApi<N> & WrapletApiDebug<N> => {
  const nodeAccessors: ((node: N) => void)[] = [];

  const destroyListeners = args.destroyListeners || [];

  const destroyCallback = args.destroyCallback;

  const defaultStatus: StatusWritable = {
    isGettingInitialized: false,
    isDestroyed: false,
    isInitialized: false,
    isGettingDestroyed: false,
  };

  const status: StatusWritable = args.status || defaultStatus;

  const initializeCallback = args.initializeCallback;

  const destroyMethod = createDefaultDestroyWrapper(
    status,
    args.core,
    args.wraplet,
    destroyListeners,
    destroyCallback,
  );

  return {
    __nodeAccessors: nodeAccessors,
    status: status,
    addDestroyListener: (callback: DestroyListener<N>) => {
      destroyListeners.push(callback);
    },

    initialize: createDefaultInitializeWrapper(
      status,
      args.core,
      destroyMethod,
      initializeCallback,
    ),

    destroy: destroyMethod,

    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(args.core.node);
    },
  };
};
