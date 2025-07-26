export type GroupExtractor = (node: Node) => string[];

export interface Groupable {
  isGroupable: true;
  setGroupsExtractor(callback: GroupExtractor): void;
  getGroups(): string[];
}

export function isGroupableGuard(object: object): object is Groupable {
  return (
    (object as { isGroupable: unknown }).isGroupable === true &&
    Object.hasOwn(object, "getGroups")
  );
}
