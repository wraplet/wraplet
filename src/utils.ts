import { Wraplet } from "./types/Wraplet";

export function isWraplet<N extends Node = Node>(
  obj: unknown,
): obj is Wraplet<N> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "isWraplet" in obj &&
    obj.isWraplet === true
  );
}

export function getWrapletsFromNode<N extends Node = Node>(
  node: N,
): Wraplet<N>[] {
  const wraplets = node.wraplets;
  if (!Array.isArray(wraplets)) {
    return [];
  }

  return wraplets as Wraplet<N>[];
}

export function actOnNodesRecursevily(
  node: Node,
  callback: (node: Node) => void,
): void {
  callback(node);
  const children = node.childNodes;
  for (const child of children) {
    actOnNodesRecursevily(child, callback);
  }
}

export function destroyWrapletsRecursively(node: Node): void {
  actOnNodesRecursevily(node, (node) => {
    const wraplets = getWrapletsFromNode(node);
    for (const wraplet of wraplets) {
      wraplet.destroy();
    }
  });
}
