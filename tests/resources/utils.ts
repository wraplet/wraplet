/* istanbul ignore file */

export function createElementTree(
  depth: number,
  childrenPerNode: number,
  breadcrumbs: string[] = [],
): HTMLElement {
  const root = document.createElement("div");
  if (depth > 0) {
    for (let i = 0; i < childrenPerNode; i++) {
      const newBreadcrumbs = [...breadcrumbs, String(i)];
      const child = createElementTree(
        depth - 1,
        childrenPerNode,
        newBreadcrumbs,
      );
      child.setAttribute(`data-id-${newBreadcrumbs.join("-")}`, "");
      root.appendChild(child);
    }
  }

  return root;
}

export function predictElementCount(
  depth: number,
  childrenPerNode: number,
): number {
  if (depth < 0) {
    return 0;
  }

  if (depth === 0) {
    return 1; // Just the root node
  }

  // For each level, we multiply the previous level's nodes by childrenPerNode
  // This forms a geometric series: 1 + n + n^2 + ... + n^depth
  // Where n is childrenPerNode
  let totalNodes = 1; // Start with the root node
  let nodesAtCurrentLevel = 1;

  for (let i = 0; i < depth; i++) {
    nodesAtCurrentLevel *= childrenPerNode;
    totalNodes += nodesAtCurrentLevel;
  }

  return totalNodes;
}

export function countNodesRecursively(node: Node): number {
  let count = 1; // Count the node itself
  if (node.hasChildNodes()) {
    for (const child of node.childNodes) {
      count += countNodesRecursively(child);
    }
  }
  return count;
}
