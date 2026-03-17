import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import { WrapletApiDebug } from "./types/WrapletApi";
import { createWrapletApi } from "./createWrapletApi";
import { CoreDependentWrapletApiFactoryArgs } from "./types/CoreDependentWrapletApiFactoryArgs";
import { DependentWrapletApi } from "./types/DependentWrapletApi";
import { Wraplet } from "./types/Wraplet";

export const createCoreDependentWrapletApi = <
  N extends Node,
  M extends WrapletDependencyMap,
>(
  args: CoreDependentWrapletApiFactoryArgs<N, M>,
): DependentWrapletApi<N> & WrapletApiDebug<N> => {
  return Object.assign(
    createWrapletApi({
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
    }),
    {
      getChildrenDependencies: (): Wraplet[] => {
        return args.core.getChildrenDependencies();
      },
    },
  );
};
