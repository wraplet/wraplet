import { is } from "../../utils/is";
import { WrapletApi } from "./WrapletApi";

export const WrapletSymbol = Symbol("Wraplet");

export interface Wraplet {
  [WrapletSymbol]: true;
  wraplet: WrapletApi;
}

export function isWraplet(object: unknown): object is Wraplet {
  return is(object, WrapletSymbol);
}
