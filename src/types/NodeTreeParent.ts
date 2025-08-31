import { Wraplet } from "./Wraplet";

const NodeTreeParentSymbol = Symbol("NodeTreeParent");
export { NodeTreeParentSymbol };

export interface NodeTreeParent {
  [NodeTreeParentSymbol]: true;
  getNodeTreeChildren(): Wraplet[];
}

/* istanbul ignore next */
export function isNodeTreeParent(object: object): object is NodeTreeParent {
  return (
    (object as { [NodeTreeParentSymbol]: unknown })[NodeTreeParentSymbol] ===
    true
  );
}
