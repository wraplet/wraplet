import { Wraplet } from "../../Wraplet/types/Wraplet";

export type DestroyListener<W extends Wraplet = Wraplet> = (
  wraplet: W,
) => Promise<void>;
