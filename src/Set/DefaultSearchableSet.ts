import { BaseSet } from "./types/BaseSet";

export class DefaultSearchableSet<T> extends Set<T> implements BaseSet<T> {
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

  public getOrdered(callback: (item: T) => number): T[] {
    return Array.from(this).sort((a, b) => callback(a) - callback(b));
  }
}
