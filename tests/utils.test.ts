import "./setup";
import { DefaultWrapletSet, getWrapletsFromNode, Wraplet } from "../src";
import { addWrapletToNode, removeWrapletFromNode } from "../src/utils";

it("Test removing and adding wraplets to nodes", () => {
  const node = document.createElement("div");
  const mock = jest.fn() as unknown as Wraplet<HTMLDivElement>;

  const removed = removeWrapletFromNode(mock, node);
  // Wasn't added so it cannot be removed.
  expect(removed).toBe(false);

  addWrapletToNode(mock, node);
  expect(node.wraplets).toBeDefined();
  const wraplets = getWrapletsFromNode(node);
  expect(wraplets).toBeInstanceOf(DefaultWrapletSet);
  expect(wraplets.size).toBe(1);

  wraplets.has(mock);

  removeWrapletFromNode(mock, node);

  expect(wraplets.size).toBe(0);
});
