import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import { DependencyApiFactoryArgs } from "./types/DependencyApiFactoryArgs";
import {
  DependencyApi,
  DependencyApiDebug,
  DependencyApiSymbol,
} from "./types/DependencyApi";
import { createOuterInitializeCallback } from "./createOuterInitializeCallback";
import { createOuterDestroyCallback } from "./createOuterDestroyCallback";
import { isDependency } from "./types/Wraplet";

function validateDependencyApiFactoryArgs(
  args: DependencyApiFactoryArgs,
): void {
  if (!isDependency(args.wraplet)) {
    throw new Error("Correct wraplet instance has to be provided.");
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

export const createDependencyApi = (
  args: DependencyApiFactoryArgs,
): DependencyApi & DependencyApiDebug => {
  validateDependencyApiFactoryArgs(args);

  const defaultStatus = {
    isGettingInitialized: false,
    isDestroyed: false,
    isInitialized: false,
    isGettingDestroyed: false,
  };

  const api: Partial<DependencyApi & DependencyApiDebug> = {};

  const destroyListeners: DestroyListener[] = [];

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
        await args.initializeCallback();
      }
    },
  ).bind(api);

  return Object.assign(api, {
    [DependencyApiSymbol]: true,
    __destroyListeners: destroyListeners,
    status: defaultStatus,
    addDestroyListener: (callback: DestroyListener) => {
      destroyListeners.push(callback);
    },

    initialize: initializeCallback,

    destroy: destroyCallback,
  });
};
