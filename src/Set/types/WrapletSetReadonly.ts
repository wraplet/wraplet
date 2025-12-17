import { Wraplet } from "../../Wraplet/types/Wraplet";
import { BaseSet } from "./BaseSet";

const WrapletSetReadonlySymbol = Symbol("WrapletSetReadonly");
export { WrapletSetReadonlySymbol };

export interface WrapletSetReadonly<T extends Wraplet = Wraplet>
  extends BaseSet<T>, ReadonlySet<T> {
  [WrapletSetReadonlySymbol]: true;
}
