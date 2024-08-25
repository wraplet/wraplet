import { Wraplet } from "./Wraplet";

declare global {
  interface Element {
    wraplets?: Wraplet[];
  }
}
