const CollectionReadonlySymbol = Symbol("CollectionReadonly");
export { CollectionReadonlySymbol };

export interface CollectionReadonly<T> {
  /**W
   * @param filter
   *   Return true for all objects that should be included in the results.
   */
  find(filter: (item: T) => boolean): T[];

  /**
   * @param condition
   *   Returns the first object that meets the condition.
   */
  findOne(condition: (item: T) => boolean): T | null;
}

const isCollectionReadonly = <T>(
  object: object,
): object is CollectionReadonly<T> => {
  return (
    (object as { [CollectionReadonlySymbol]: unknown })[
      CollectionReadonlySymbol
    ] === true
  );
};

export { isCollectionReadonly };
