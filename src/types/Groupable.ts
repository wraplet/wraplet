import { is } from "../utils/is";

export type GroupExtractor = (node: Node) => string[];

const GroupableSymbol = Symbol("Groupable");
export { GroupableSymbol };

export interface Groupable {
  [GroupableSymbol]: true;
  wraplet: {
    setGroupsExtractor(callback: GroupExtractor): void;
    getGroups(): string[];
  };
}

export function isGroupable(object: unknown): object is Groupable {
  return is(object, GroupableSymbol);
}

const defaultGroupableAttribute = "data-js-wraplet-groupable";

export { defaultGroupableAttribute };
