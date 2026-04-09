import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../NodeTreeManager/utils";
import { createDependencyApi } from "./createDependencyApi";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import {
  WrapletApi,
  WrapletApiDebug,
  WrapletApiSymbol,
} from "./types/WrapletApi";
import { isWraplet } from "./types/Wraplet";

function validateNodeWrapletApiFactoryArgs<N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): void {
  if (!isWraplet(args.wraplet)) {
    throw new Error("Correct wraplet instance has to be provided.");
  }

  if (!(args.node instanceof Node)) {
    throw new Error("Correct node has to be provided.");
  }
}

export const createWrapletApi = <N extends Node>(
  args: WrapletApiFactoryArgs<N>,
): WrapletApi<N> & WrapletApiDebug<N> => {
  const nodeAccessors: ((node: N) => void)[] = [];

  const newArgs = { ...args };

  const originalInitCallback = newArgs.initializeCallback;
  newArgs.initializeCallback = async () => {
    addWrapletToNode(newArgs.wraplet, newArgs.node);
    if (originalInitCallback) {
      await originalInitCallback();
    }
  };

  const originalDestroyCallback = newArgs.destroyCallback;
  newArgs.destroyCallback = async () => {
    if (originalDestroyCallback) {
      await originalDestroyCallback();
    }
    removeWrapletFromNode(newArgs.wraplet, newArgs.node);
    nodeAccessors.length = 0;
  };

  const dependencyApi = createDependencyApi(newArgs);
  validateNodeWrapletApiFactoryArgs(newArgs);
  return Object.assign(dependencyApi, {
    [WrapletApiSymbol]: true as const,
    __nodeAccessors: nodeAccessors,
    addDestroyListener:
      dependencyApi.addDestroyListener as WrapletApi<N>["addDestroyListener"],
    accessNode: (callback: (node: N) => void) => {
      nodeAccessors.push(callback);
      callback(newArgs.node);
    },
  });
};
