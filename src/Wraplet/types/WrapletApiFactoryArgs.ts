import { NodelessWrapletApiFactoryArgs } from "./NodelessWrapletApiFactoryArgs";
import { Wraplet } from "./Wraplet";

export type WrapletApiFactoryArgs<N extends Node = Node> = {
  node: N;
  wraplet: Wraplet<N>;
} & NodelessWrapletApiFactoryArgs;
