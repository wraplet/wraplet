import { Wraplet } from "../../types/Wraplet";
import { BaseSet } from "./BaseSet";

const WrapletSetReadonlySymbol = Symbol("WrapletSetReadonly");
export { WrapletSetReadonlySymbol };

export interface WrapletSetReadonly<T extends Wraplet = Wraplet>
  extends BaseSet<T>, ReadonlySet<T> {
  [WrapletSetReadonlySymbol]: true;
}
