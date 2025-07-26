import { Wraplet } from "./Wraplet";

export interface NodeTreeParent {
  isNodeTreeParent: true;
  getNodeTreeChildren(): Wraplet[];
}

export function isNodeTreeParent(object: object): object is NodeTreeParent {
  return (object as { isNodeTreeParent: unknown }).isNodeTreeParent === true;
}
