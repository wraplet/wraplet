import { Wraplet } from "./types/Wraplet";
import { createWrapletApi } from "./createWrapletApi";
import { WrapletApiFactoryArgs } from "./types/WrapletApiFactoryArgs";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryCallbacks";

export type Wiring = Omit<WrapletApiFactoryArgs, "wraplet" | "node">;

export function mergeWirings(wirings: Wiring[]): Wiring {
  const initializeCallbacks = wirings.map(
    (config) => config.initializeCallback,
  );
  // Destruction happens in the reverse order of initialization.
  const destroyCallbacks = wirings
    .map((config) => config.destroyCallback)
    .reverse();

  return {
    initializeCallback: async (): Promise<void> => {
      for (const callback of initializeCallbacks) {
        await callback?.();
      }
    },
    destroyCallback: async (): Promise<void> => {
      for (const callback of destroyCallbacks) {
        await callback?.();
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

export function composeWrapletApi(
  node: Node,
  wraplet: Wraplet,
  wirings: Wiring[],
) {
  return createWrapletApi(
    Object.assign({ node, wraplet }, mergeWirings(wirings)),
  );
}
