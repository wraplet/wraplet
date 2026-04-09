import { DependencyApiFactoryArgs } from "./DependencyApiFactoryArgs";
import { Wraplet } from "./Wraplet";

export type WrapletApiFactoryArgs<N extends Node = Node> = {
  node: N;
  wraplet: Wraplet<N>;
} & Omit<DependencyApiFactoryArgs, "wraplet">;
