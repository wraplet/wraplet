import { Wraplet } from "../types/Wraplet";
import { SearchableSet } from "./SearchableSet";

const WrapletSetSymbol = Symbol("WrapletSet");
export { WrapletSetSymbol };

export interface WrapletSet extends SearchableSet<Wraplet>, Set<Wraplet> {
  [WrapletSetSymbol]: true;
}

const isWrapletSet = (object: object): object is WrapletSet => {
  return (object as { [WrapletSetSymbol]: unknown })[WrapletSetSymbol] === true;
};

export { isWrapletSet };
