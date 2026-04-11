import { Wraplet } from "../../Wraplet/types/Wraplet";
import { BaseSet } from "./BaseSet";

import { is } from "../../utils/is";

const WrapletSetSymbol = Symbol("WrapletSet");
export { WrapletSetSymbol };

export interface WrapletSet<W extends Wraplet = Wraplet>
  extends BaseSet<W>, Set<W> {
  [WrapletSetSymbol]: true;
}

export function isWrapletSet(object: unknown): object is WrapletSet {
  return is(object, WrapletSetSymbol);
}
