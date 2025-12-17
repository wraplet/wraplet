import { Wraplet } from "../../Wraplet/types/Wraplet";

export type DestroyListener<N extends Node> = (
  wraplet: Wraplet<N>,
) => Promise<void>;
