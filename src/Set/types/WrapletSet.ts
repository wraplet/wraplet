import { NodelessWraplet } from "../../Wraplet/types/Wraplet";
import { BaseSet } from "./BaseSet";

import { is } from "../../utils/is";

const WrapletSetSymbol = Symbol("WrapletSet");
export { WrapletSetSymbol };

export interface WrapletSet<W extends NodelessWraplet = NodelessWraplet>
  extends BaseSet<W>, Set<W> {
  [WrapletSetSymbol]: true;
}

export function isWrapletSet<W extends NodelessWraplet>(
  object: unknown,
): object is WrapletSet<W> {
  return is(object, WrapletSetSymbol);
}
