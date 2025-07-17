export function isParentNode(node: Node): node is ParentNode {
  return typeof (node as any).querySelectorAll === "function";
}
