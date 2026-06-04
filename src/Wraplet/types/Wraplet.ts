import { is } from "../../utils/is";
import { WrapletApi, WrapletApiSymbol } from "./WrapletApi";

export interface Wraplet {
  wraplet: WrapletApi;
}

export function isWraplet(value: unknown): value is Wraplet {
  return (
    typeof value === "object" &&
    value !== null &&
    is((value as { wraplet: unknown }).wraplet, WrapletApiSymbol)
  );
}
