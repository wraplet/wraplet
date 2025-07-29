import { SearchableSet } from "./SearchableSet";

export class DefaultSearchableSet<T>
  extends Set<T>
  implements SearchableSet<T>
{
  public find(filter: (wraplet: T) => boolean): T[] {
    const results: T[] = [];
    for (const item of this) {
      if (!filter(item)) {
        continue;
      }
      results.push(item);
    }
    return results;
  }

  public findOne(filter: (wraplet: T) => boolean): T | null {
    for (const item of this) {
      if (filter(item)) {
        return item;
      }
    }
    return null;
  }
}
