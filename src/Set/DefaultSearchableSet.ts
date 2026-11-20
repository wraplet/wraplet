import { BaseSet } from "./types/BaseSet";
import { WrapletSet } from "./types/WrapletSet";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { DefaultWrapletSet } from "./DefaultWrapletSet";

export class DefaultSearchableSet<T extends Wraplet>
  extends Set<T>
  implements BaseSet<T>
{
  public find(filter: (wraplet: T) => boolean): WrapletSet<T> {
    const results: WrapletSet<T> = new DefaultWrapletSet<T>();
    for (const item of this) {
      if (!filter(item)) {
        continue;
      }
      results.add(item);
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
