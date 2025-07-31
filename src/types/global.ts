import { WrapletSet } from "./Set/WrapletSet";

declare global {
  interface Node {
    wraplets?: WrapletSet;
  }
}
