import { CollectionReadonly } from "./CollectionReadonly";

const CollectionSymbol = Symbol("Collection");
export { CollectionSymbol };

export interface Collection<T> extends CollectionReadonly<T> {
  add(item: T): void;
  delete(item: T): void;
}

const isCollection = <T>(object: object): object is Collection<T> => {
  return (object as { [CollectionSymbol]: unknown })[CollectionSymbol] === true;
};

export { isCollection };
