import { Wraplet } from "./Wraplet";

const NodeTreeParentSymbol = Symbol("NodeTreeParent");
export { NodeTreeParentSymbol };

export interface NodeTreeParent {
  [NodeTreeParentSymbol]: true;
  wraplet: {
    getNodeTreeChildren(): Wraplet[];
  };
}

export function isNodeTreeParent(object: object): object is NodeTreeParent {
  return (
    (object as { [NodeTreeParentSymbol]: unknown })[NodeTreeParentSymbol] ===
    true
  );
}
