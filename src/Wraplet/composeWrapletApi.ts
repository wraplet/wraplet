import { Wraplet } from "./types/Wraplet";
import { createWrapletApi } from "./createWrapletApi";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";

export type Wiring = Omit<WrapletApiFactoryArgs, "wraplet" | "node">;

export type Wireable = {
  wiring(): Wiring;
};

export function mergeWirings(wirings: Wiring[]): Wiring {
  const initializeCallbacks = wirings.map(
    (config) => config.initializeCallback,
  );
  // Destruction happens in the reverse order of initialization.
  const destroyCallbacks = wirings
    .map((config) => config.destroyCallback)
    .reverse();

  return {
    initializeCallback: async (wraplet): Promise<void> => {
      for (const callback of initializeCallbacks) {
        await callback?.(wraplet);
      }
    },
    destroyCallback: async (wraplet): Promise<void> => {
      for (const callback of destroyCallbacks) {
        await callback?.(wraplet);
      }
    },
  };
}

export function wireCallback(
  callbackName: keyof Wiring,
  callback: WrapletApiFactoryBasicCallback,
): Wiring {
  return {
    [callbackName]: callback,
  };
}

/**
 * Returns a wiring that evaluates the callback lazily on the first lifecycle event
 * and then reuses the same returned wiring for subsequent lifecycle events.
 */
export function lazyWiring(callback: () => Wiring | void): Wiring {
  let evaluated = false;
  let cachedCallbackResult: Wiring | void;

  const getWiring = (): Wiring | void => {
    if (!evaluated) {
      cachedCallbackResult = callback();
      evaluated = true;
    }

    return cachedCallbackResult;
  };

  return {
    initializeCallback: async (wraplet) => {
      return getWiring()?.initializeCallback?.(wraplet);
    },
    destroyCallback: async (wraplet) => {
      return getWiring()?.destroyCallback?.(wraplet);
    },
  };
}

export function composeWrapletApi(
  node: Node,
  wraplet: Wraplet,
  wirings: Wiring[],
) {
  return createWrapletApi(
    Object.assign({ node, wraplet }, mergeWirings(wirings)),
  );
}
