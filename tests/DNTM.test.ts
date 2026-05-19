import "./setup";
import { NodeTreeManager } from "../src/NodeTreeManager/types/NodeTreeManager";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { DNTM } from "../src/NodeTreeManager/DNTM";
import { Status } from "../src";
import { isParentNode } from "../src/NodeTreeManager/utils";

it("Test default node tree manager destroy tree", async () => {
  const func = jest.fn();

  class TestWraplet extends BaseElementTestWraplet {
    status: Status = {
      isGettingInitialized: false,
      isInitialized: false,
      isDestroyed: false,
      isGettingDestroyed: false,
    };

    protected async onDestroy(): Promise<void> {
      func();
    }
  }

  const attribute = "data-test-selector";

  document.body.innerHTML = `
<div ${attribute}>
    <div ${attribute}></div>
</div>`;

  const manager: NodeTreeManager = new DNTM();

  manager.addNodeInitializer(async (node) => {
    if (!isParentNode(node)) {
      return;
    }

    const wraplets = TestWraplet.createAll(attribute, {}, node);
    for (const wraplet of wraplets) {
      await wraplet.wraplet.initialize();
    }
  });

  await manager.initializeNode(document);

  const element = document.querySelector(`[${attribute}]`) as Element;
  await manager.destroyNode(element);

  expect(func).toHaveBeenCalledTimes(2);
});

it("Test default node tree manager initialize tree", async () => {
  class TestWraplet extends BaseElementTestWraplet {}

  document.body.innerHTML = `
<div></div>
  `;

  const attribute = "data-test-selector";

  const element = document.createElement("div");
  element.setAttribute(attribute, "");

  const manager: NodeTreeManager = new DNTM();
  const func = jest.fn();
  manager.addNodeInitializer(async (node: Node) => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }
    func();
    const wraplet = TestWraplet.create(attribute, {}, node);
    if (!wraplet) {
      throw new Error("Wraplet not created.");
    }
    await wraplet.wraplet.initialize();
  });

  await manager.initializeNode(element);

  if (!element.wraplets) {
    throw new Error("No wraplets found in the element.");
  }

  expect(func).toHaveBeenCalledTimes(1);
  expect(element.wraplets.size).toBeDefined();
  expect(element.wraplets.size).toBe(1);
});

it("Test default node tree manager handles rejected initializer", async () => {
  const manager: NodeTreeManager = new DNTM();
  const error = new Error("Initializer failed");

  manager.addNodeInitializer(async () => {
    throw error;
  });

  const consoleSpy = jest.spyOn(console, "error").mockImplementation();

  await expect(manager.initializeNode(document)).rejects.toThrow(
    "There were errors during the node's initialization.",
  );

  consoleSpy.mockRestore();
});
