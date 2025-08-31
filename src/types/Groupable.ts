import { is } from "./Utils";

export type GroupExtractor = (node: Node) => string[];

const GroupableSymbol = Symbol("Groupable");
export { GroupableSymbol };

export interface Groupable {
  [GroupableSymbol]: true;
  setGroupsExtractor(callback: GroupExtractor): void;
  getGroups(): string[];
}

/* istanbul ignore next */
export function isGroupable(object: unknown): object is Groupable {
  return is(object, GroupableSymbol);
}

const defaultGroupableAttribute = "data-js-wraplet-groupable";

export { defaultGroupableAttribute };
