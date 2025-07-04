import { Wraplet } from "./Wraplet";

export type DestroyListener<N extends Node> = (wraplet: Wraplet<N>) => void;

export type DestroyChildListener<N extends Node> = (
  wraplet: Wraplet<N>,
  id: string,
) => void;
