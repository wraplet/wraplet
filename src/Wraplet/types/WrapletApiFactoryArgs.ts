import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryBasicCallback";
import { Wraplet } from "./Wraplet";

export type WrapletApiFactoryArgs<N extends Node = Node> = {
  node: N;
  wraplet: Wraplet<N>;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
};
