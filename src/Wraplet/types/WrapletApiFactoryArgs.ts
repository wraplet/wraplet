import { Wraplet } from "./Wraplet";
import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryCallbacks";

export type WrapletApiFactoryArgs<N extends Node = Node> = {
  node?: N;
  wraplet: Wraplet;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
};
