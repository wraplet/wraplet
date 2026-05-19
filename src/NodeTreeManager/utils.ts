import { Wraplet } from "../Wraplet/types/Wraplet";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import { isWrapletSet, WrapletSet } from "../Set/types/WrapletSet";
import { throwIfErrors } from "../utils/utils";

export function isParentNode(node: Node): node is ParentNode {
  return (
    typeof (node as Node & { querySelectorAll: unknown }).querySelectorAll ===
    "function"
  );
}

export function getWrapletsFromNode<N extends Node = Node>(
  node: N,
): WrapletSet | null {
  const wraplets = node.wraplets;
  if (isWrapletSet(wraplets)) {
    return wraplets;
  }

  return null;
}

export function removeWrapletFromNode<N extends Node>(
  wraplet: Wraplet,
  node: N,
): boolean {
  const wraplets = getWrapletsFromNode(node);
  if (!wraplets) {
    return false;
  }
  return wraplets.delete(wraplet);
}

export function addWrapletToNode<N extends Node>(
  wraplet: Wraplet,
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
  const stack: Node[] = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    callback(current);
    const children = current.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push(children[i]);
    }
  }
}

export async function findWrapletsOutsideTheTree(
  wraplets: Wraplet[],
  node: Node,
) {
  const wrapletsOutsideTree = new DefaultWrapletSet(wraplets);
  actOnNodesRecursively(node, (node) => {
    const nodeWraplets = getWrapletsFromNode(node);
    if (!nodeWraplets) {
      return;
    }
    for (const wraplet of nodeWraplets) {
      wrapletsOutsideTree.delete(wraplet);
    }
  });
  return Array.from(wrapletsOutsideTree);
}

export async function destroyWrapletsRecursively(node: Node): Promise<void> {
  const allWraplets: Wraplet[] = [];
  actOnNodesRecursively(node, (node) => {
    const wraplets = getWrapletsFromNode(node);
    if (!wraplets) {
      return;
    }
    for (const wraplet of [...wraplets]) {
      if (
        wraplet.wraplet.status.isGettingDestroyed ||
        wraplet.wraplet.status.isDestroyed
      ) {
        continue;
      }

      allWraplets.push(wraplet);
    }
  });

  const errors: Error[] = [];

  await Promise.all(
    allWraplets.map(async (wraplet) => {
      try {
        await wraplet.wraplet.destroy();
      } catch (error) {
        errors.push(error as Error);
      }
    }),
  );

  throwIfErrors(errors, "Some wraplets threw exceptions during destruction");
}
