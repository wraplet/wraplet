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

export function isParentNode(node: Node): node is ParentNode {
  return (
    typeof (node as Node & { querySelectorAll: unknown }).querySelectorAll ===
    "function"
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

export function removeWrapletFromNode<N extends Node>(
  wraplet: Wraplet<N>,
  node: N,
): void {
  const index = node.wraplets?.findIndex((value) => {
    return value === wraplet;
  });

  if (index !== undefined && index > -1) {
    node.wraplets?.splice(index, 1);
  }
}

export function addWrapletToNode<N extends Node>(
  wraplet: Wraplet<N>,
  node: N,
): void {
  if (!node.wraplets) {
    node.wraplets = [];
  }
  node.wraplets.push(wraplet);
}

export function actOnNodesRecursively(
  node: Node,
  callback: (node: Node) => void,
): void {
  callback(node);
  const children = node.childNodes;
  for (const child of children) {
    actOnNodesRecursively(child, callback);
  }
}

export function destroyWrapletsRecursively(node: Node): void {
  actOnNodesRecursively(node, (node) => {
    const wraplets = getWrapletsFromNode(node);
    for (const wraplet of wraplets) {
      wraplet.destroy();
    }
  });
}
