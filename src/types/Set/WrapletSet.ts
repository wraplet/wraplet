import { Wraplet } from "../Wraplet";
import { BaseSet } from "./BaseSet";
import { is } from "../Utils";

const WrapletSetSymbol = Symbol("WrapletSet");
export { WrapletSetSymbol };

export interface WrapletSet extends BaseSet<Wraplet>, Set<Wraplet> {
  [WrapletSetSymbol]: true;
}

export function isWrapletSet(object: unknown): object is WrapletSet {
  return is(object, WrapletSetSymbol);
}
