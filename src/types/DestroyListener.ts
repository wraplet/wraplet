import { Wraplet } from "./Wraplet";

export type DestroyListener<N extends Node> = (
  wraplet: Wraplet<N>,
) => Promise<void>;
