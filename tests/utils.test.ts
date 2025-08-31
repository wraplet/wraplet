import "./setup";
import { Wraplet } from "../src";
import { addWrapletToNode, removeWrapletFromNode } from "../src/utils";

it("Test removing and adding wraplets to nodes", () => {
  const node = document.createElement("div");
  const mock = jest.fn() as unknown as Wraplet;

  const removed = removeWrapletFromNode(mock, node);
  // Wasn't added so it cannot be removed.
  expect(removed).toBe(false);

  addWrapletToNode(mock, node);
  expect(node.wraplets).toBeDefined();
  if (!node.wraplets) {
    throw new Error("Wraplets not defined.");
  }
  node.wraplets.has(mock);
  removeWrapletFromNode(mock, node);

  expect(node.wraplets.size).toBe(0);
});
