import { Wraplet } from "../Wraplet";
import { BaseSet } from "./BaseSet";
import { is } from "../Utils";

const WrapletSetSymbol = Symbol("WrapletSet");
export { WrapletSetSymbol };

export interface WrapletSet<W extends Wraplet = Wraplet>
  extends BaseSet<W>,
    Set<W> {
  [WrapletSetSymbol]: true;
}

export function isWrapletSet<W extends Wraplet>(
  object: unknown,
): object is WrapletSet<W> {
  return is(object, WrapletSetSymbol);
}
