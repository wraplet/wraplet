import { NodelessWraplet } from "../../Wraplet/types/Wraplet";

export type DestroyListener<W extends NodelessWraplet = NodelessWraplet> = (
  wraplet: W,
) => Promise<void>;
