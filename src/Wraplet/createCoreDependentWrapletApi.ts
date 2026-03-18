import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import { WrapletApi, WrapletApiDebug } from "./types/WrapletApi";
import { createWrapletApi } from "./createWrapletApi";
import { CoreDependentWrapletApiFactoryArgs } from "./types/CoreDependentWrapletApiFactoryArgs";

export const createCoreDependentWrapletApi = <
  N extends Node,
  M extends WrapletDependencyMap,
>(
  args: CoreDependentWrapletApiFactoryArgs<N, M>,
): WrapletApi<N> & WrapletApiDebug<N> => {
  return createWrapletApi({
    wraplet: args.wraplet,
    node: args.core.node,
    initializeCallback: async () => {
      await args.core.initializeDependencies();
      if (args.initializeCallback) {
        await args.initializeCallback();
      }
    },
    destroyCallback: async () => {
      await args.core.destroy();
      if (args.destroyCallback) {
        await args.destroyCallback();
      }
    },
  });
};
