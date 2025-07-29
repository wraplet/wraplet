export type GroupExtractor = (node: Node) => string[];

const GroupableSymbol = Symbol("Groupable");
export { GroupableSymbol };

export interface Groupable {
  [GroupableSymbol]: true;
  setGroupsExtractor(callback: GroupExtractor): void;
  getGroups(): string[];
}

/* istanbul ignore next */
export function isGroupable(object: object): object is Groupable {
  return (object as { [GroupableSymbol]: unknown })[GroupableSymbol] === true;
}

const defaultGroupableAttribute = "data-js-wraplet-groupable";

export { defaultGroupableAttribute };
