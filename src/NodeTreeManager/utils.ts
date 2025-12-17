import { Wraplet } from "../Core/types/Wraplet";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import { isWrapletSet, WrapletSet } from "../Set/types/WrapletSet";

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

export async function actOnNodesRecursively(
  node: Node,
  callback: (node: Node) => Promise<void>,
): Promise<void> {
  await callback(node);
  const children = node.childNodes;
  for (const child of children) {
    await actOnNodesRecursively(child, callback);
  }
}

export async function destroyWrapletsRecursively(node: Node): Promise<void> {
  await actOnNodesRecursively(node, async (node) => {
    const wraplets = getWrapletsFromNode(node);
    for (const wraplet of wraplets) {
      if (!wraplet.wraplet.isGettingDestroyed && !wraplet.wraplet.isDestroyed) {
        await wraplet.wraplet.destroy();
      }
      removeWrapletFromNode(wraplet, node);
    }
  });
}
