import { Wraplet } from "./Wraplet";
import { LifecycleListener } from "./LifecycleListener";

export type WrapletApiFactoryArgs<N extends Node = Node> = {
  node?: N;
  wraplet: Wraplet;
  destroyCallback?: LifecycleListener;
  initializeCallback?: LifecycleListener;
};
