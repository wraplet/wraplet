import { WrapletSet } from "../Set/types/WrapletSet";

declare global {
  interface Node {
    wraplets?: WrapletSet;
  }
}
