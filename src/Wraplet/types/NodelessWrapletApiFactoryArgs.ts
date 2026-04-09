import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryCallbacks";
import { Wraplets } from "./Wraplet";

export type NodelessWrapletApiFactoryArgs = {
  wraplet: Wraplets;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
};
