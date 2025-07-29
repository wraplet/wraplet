import { Wraplet } from "../Wraplet";
import { BaseSet } from "./BaseSet";

const WrapletSetReadonlySymbol = Symbol("WrapletSetReadonly");
export { WrapletSetReadonlySymbol };

export interface WrapletSetReadonly<T extends Wraplet = Wraplet>
  extends BaseSet<T>,
    ReadonlySet<T> {
  [WrapletSetReadonlySymbol]: true;
}

const isWrapletSetReadonly = (object: object): object is WrapletSetReadonly => {
  return (
    (object as { [WrapletSetReadonlySymbol]: unknown })[
      WrapletSetReadonlySymbol
    ] === true
  );
};

export { isWrapletSetReadonly };
