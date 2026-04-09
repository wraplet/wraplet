import { Dependencies } from "../../Wraplet/types/Wraplet";

export type DestroyListener<W extends Dependencies = Dependencies> = (
  wraplet: W,
) => Promise<void>;
