import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../NodeTreeManager/utils";
import { createNodelessWrapletApi } from "./createNodelessWrapletApi";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import {
  WrapletApi,
  WrapletApiDebug,
  WrapletApiSymbol,
} from "./types/WrapletApi";

function validateNodeWrapletApiFactoryArgs<N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): void {
  if (!(args.node instanceof Node)) {
    throw new Error("Correct node has to be provided.");
  }
}

export const createWrapletApi = <N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): WrapletApi<N> & WrapletApiDebug<N> => {
  const nodeAccessors: ((node: N) => void)[] = [];

  const originalInitCallback = args.initializeCallback;

  args.initializeCallback = async () => {
    addWrapletToNode(args.wraplet, args.node);
    if (originalInitCallback) {
      await originalInitCallback();
    }
  };

  const originalDestroyCallback = args.destroyCallback;
  args.destroyCallback = async () => {
    if (originalDestroyCallback) {
      await originalDestroyCallback();
    }
    removeWrapletFromNode(args.wraplet, args.node);
    nodeAccessors.length = 0;
  };

  const nodelessWrapletApi = createNodelessWrapletApi(args);
  validateNodeWrapletApiFactoryArgs(args);
  return Object.assign(nodelessWrapletApi, {
    [WrapletApiSymbol]: true as const,
    __nodeAccessors: nodeAccessors,
    addDestroyListener: nodelessWrapletApi.addDestroyListener,
    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(args.node);
    },
  });
};
