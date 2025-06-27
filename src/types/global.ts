import { Wraplet } from "./Wraplet";

declare global {
  interface Node {
    wraplets?: Wraplet[];
  }
}
