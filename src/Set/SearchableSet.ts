export interface SearchableSet<T> {
  find(filter: (wraplet: T) => boolean): T[];
  findOne(filter: (wraplet: T) => boolean): T | null;
}
