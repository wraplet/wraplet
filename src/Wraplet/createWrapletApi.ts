import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { Wraplet } from "./types/Wraplet";
import { DestroyListener } from "../Core/types/DestroyListener";
import {
  defaultGroupableAttribute,
  Groupable,
  GroupExtractor,
} from "../types/Groupable";
import { NodeTreeParent } from "../NodeTreeManager/types/NodeTreeParent";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { StatusWritable } from "./types/Status";

export const createWrapletApi = <N extends Node, M extends WrapletChildrenMap>(
  args: WrapletApiFactoryArgs<N, M>,
): WrapletApi<N> &
  WrapletApiDebug<N> &
  NodeTreeParent["wraplet"] &
  Groupable["wraplet"] => {
  const nodeAccessors: ((node: N) => void)[] = [];
  const defaultGroupExtractor: GroupExtractor = (node: Node) => {
    if (node instanceof Element) {
      const groupsString = node.getAttribute(defaultGroupableAttribute);
      if (groupsString) {
        return groupsString.split(",");
      }
    }

    return [];
  };

  const destroyListeners = args.destroyListeners || [];

  let groupExtractor: GroupExtractor =
    args.groupExtractor || defaultGroupExtractor;

  const destroyCallback = args.destroyCallback;

  const defaultStatus: StatusWritable = {
    isGettingInitialized: false,
    isDestroyed: false,
    isInitialized: false,
    isGettingDestroyed: false,
  };

  const status: StatusWritable = args.status || defaultStatus;

  const initializeCallback = args.initializeCallback;

  const destroyMethod = async () => {
    if (status.isDestroyed) {
      return;
    }
    status.isGettingDestroyed = true;
    if (status.isGettingInitialized) {
      // If we are still initializing, then postpone destruction until after
      // initialization is finished.
      // We are leaving this method, but with `isGettingDestroyed` set to true, so
      // the initialization process will know to return here after it will finish.
      return;
    }

    if (!status.isInitialized) {
      // If we are not initialized, then we have nothing to do here.
      status.isDestroyed = true;
      status.isGettingDestroyed = false;
      return;
    }

    await args.core.destroy();
    for (const listener of destroyListeners) {
      await listener(args.wraplet);
    }

    if (destroyCallback) {
      await destroyCallback();
    }

    status.isGettingDestroyed = false;
    status.isInitialized = false;
    status.isDestroyed = true;
  };

  return {
    __nodeAccessors: nodeAccessors,
    status: status,
    addDestroyListener: (callback: DestroyListener<N>) => {
      destroyListeners.push(callback);
    },

    initialize: async () => {
      if (status.isInitialized) {
        return;
      }
      status.isGettingInitialized = true;

      await args.core.initialize();

      if (initializeCallback) {
        await initializeCallback();
      }

      status.isInitialized = true;
      status.isGettingInitialized = false;

      // If destruction has been invoked in the meantime, we can finally do it, when initialization
      // is finished.
      if (status.isGettingDestroyed) {
        await destroyMethod();
      }
    },

    destroy: destroyMethod,

    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(args.core.node);
    },

    getNodeTreeChildren: (): Wraplet[] => {
      return args.core.getNodeTreeChildren();
    },

    setGroupsExtractor: (extractor: GroupExtractor) => {
      groupExtractor = extractor;
    },

    getGroups: () => {
      return groupExtractor(args.core.node);
    },
  };
};
