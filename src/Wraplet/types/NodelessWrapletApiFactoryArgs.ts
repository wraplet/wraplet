import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryCallbacks";
import { NodelessWraplet } from "./Wraplet";

export type NodelessWrapletApiFactoryArgs = {
  wraplet: NodelessWraplet;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
};
