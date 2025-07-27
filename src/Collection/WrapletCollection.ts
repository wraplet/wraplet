import {
  isWrapletCollectionReadonly,
  WrapletCollectionReadonly,
} from "./WrapletCollectionReadonly";
import { Wraplet } from "../types/Wraplet";
import { Collection } from "./Collection";

const WrapletCollectionSymbol = Symbol("WrapletCollection");
export { WrapletCollectionSymbol };

export interface WrapletCollection
  extends WrapletCollectionReadonly,
    Collection<Wraplet> {
  [WrapletCollectionSymbol]: true;
}

const isWrapletCollection = (object: object): object is WrapletCollection => {
  return (
    (object as { [WrapletCollectionSymbol]: unknown })[
      WrapletCollectionSymbol
    ] === true && isWrapletCollectionReadonly(object)
  );
};

export { isWrapletCollection };
