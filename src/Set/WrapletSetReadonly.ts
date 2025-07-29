import { Wraplet } from "../types/Wraplet";
import { SearchableSet } from "./SearchableSet";

const WrapletSetReadonlySymbol = Symbol("WrapletSetReadonly");
export { WrapletSetReadonlySymbol };

export interface WrapletSetReadonly
  extends SearchableSet<Wraplet>,
    ReadonlySet<Wraplet> {
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
