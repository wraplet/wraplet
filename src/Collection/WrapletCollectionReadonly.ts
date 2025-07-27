import { Wraplet } from "../types/Wraplet";
import { CollectionReadonly } from "./CollectionReadonly";

const WrapletCollectionReadonlySymbol = Symbol("WrapletCollectionReadonly");
export { WrapletCollectionReadonlySymbol };

export interface WrapletCollectionReadonly extends CollectionReadonly<Wraplet> {
  [WrapletCollectionReadonlySymbol]: true;
}

const isWrapletCollectionReadonly = (
  object: object,
): object is WrapletCollectionReadonly => {
  return (
    (object as { [WrapletCollectionReadonlySymbol]: unknown })[
      WrapletCollectionReadonlySymbol
    ] === true
  );
};

export { isWrapletCollectionReadonly };
