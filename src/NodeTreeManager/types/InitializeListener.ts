import { Wraplet } from "../../Wraplet/types/Wraplet";

export type InitializeListener<CONTEXT> = (
  node: Node,
  wraplets: Wraplet[],
  context?: CONTEXT,
) => Promise<void>;
