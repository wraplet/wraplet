import { Wraplet } from "../Wraplet";
import { BaseSet } from "./BaseSet";

const WrapletSetSymbol = Symbol("WrapletSet");
export { WrapletSetSymbol };

export interface WrapletSet extends BaseSet<Wraplet>, Set<Wraplet> {
  [WrapletSetSymbol]: true;
}
