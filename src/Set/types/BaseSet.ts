export interface BaseSet<T> {
  find(filter: (wraplet: T) => boolean): T[];
  findOne(filter: (wraplet: T) => boolean): T | null;
  getOrdered(callback: (item: T) => number): T[];
}
