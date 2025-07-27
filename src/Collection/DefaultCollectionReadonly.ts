import {
  CollectionReadonly,
  CollectionReadonlySymbol,
} from "./CollectionReadonly";

export class DefaultCollectionReadonly<T> implements CollectionReadonly<T> {
  public [CollectionReadonlySymbol]: true = true;

  constructor(protected items: Set<T> = new Set()) {}

  find(filter: (wraplet: T) => boolean): T[] {
    const results: T[] = [];
    for (const item of this.items) {
      if (!filter(item)) {
        continue;
      }
      results.push(item);
    }
    return results;
  }

  findOne(filter: (wraplet: T) => boolean): T | null {
    for (const item of this.items) {
      if (filter(item)) {
        return item;
      }
    }
    return null;
  }
}
