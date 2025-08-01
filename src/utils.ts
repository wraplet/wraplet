import { Wraplet } from "./types/Wraplet";
import { DefaultWrapletSet } from "./Set/DefaultWrapletSet";
import { isWrapletSet, WrapletSet } from "./types/Set/WrapletSet";

export function isParentNode(node: Node): node is ParentNode {
  return (
    typeof (node as Node & { querySelectorAll: unknown }).querySelectorAll ===
    "function"
  );
}

export function getWrapletsFromNode<
  N extends Node = Node,
  W extends Wraplet<N> = Wraplet<N>,
>(node: N): WrapletSet<W> {
  const wraplets = node.wraplets;
  if (!isWrapletSet<W>(wraplets) || wraplets.size === 0) {
    return new DefaultWrapletSet();
  }

  return wraplets;
}

export function removeWrapletFromNode<N extends Node>(
  wraplet: Wraplet<N>,
  node: N,
): boolean {
  if (!node.wraplets) {
    return false;
  }
  return node.wraplets.delete(wraplet);
}

export function addWrapletToNode<N extends Node>(
  wraplet: Wraplet<N>,
  node: N,
): void {
  if (!node.wraplets) {
    node.wraplets = new DefaultWrapletSet();
  }
  node.wraplets.add(wraplet);
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
