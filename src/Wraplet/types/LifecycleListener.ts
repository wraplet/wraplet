import { Wraplet } from "./Wraplet";

export type LifecycleListener<W extends Wraplet = Wraplet> = (
  wraplet: W,
) => Promise<void>;
