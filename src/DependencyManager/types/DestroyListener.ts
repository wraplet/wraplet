import { Wraplets } from "../../Wraplet/types/Wraplet";

export type DestroyListener<W extends Wraplets = Wraplets> = (
  wraplet: W,
) => Promise<void>;
