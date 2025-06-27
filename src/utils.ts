import { Wraplet } from "./types/Wraplet";

export function isWraplet<N extends Node = Node>(
  obj: unknown,
): obj is Wraplet<N> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "isWraplet" in obj &&
    obj.isWraplet === true
  );
}
