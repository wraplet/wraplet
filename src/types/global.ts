import { WrapletSet } from "../Set/types/WrapletSet";
import { Wraplet } from "../Wraplet/types/Wraplet";

declare global {
  interface Node {
    wraplets?: WrapletSet<Wraplet>;
  }
}
