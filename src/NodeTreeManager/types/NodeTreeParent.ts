import { Wraplet } from "../../Wraplet/types/Wraplet";

const NodeTreeParentSymbol = Symbol("NodeTreeParent");
export { NodeTreeParentSymbol };

export interface NodeTreeParent {
  [NodeTreeParentSymbol]: true;
  wraplet: {
    getChildrenDependencies(): Wraplet[];
  };
}

export function isNodeTreeParent(object: object): object is NodeTreeParent {
  return (
    (object as { [NodeTreeParentSymbol]: unknown })[NodeTreeParentSymbol] ===
    true
  );
}
