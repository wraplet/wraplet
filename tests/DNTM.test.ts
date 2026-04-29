import "./setup";
import { NodeTreeManager } from "../src/NodeTreeManager/types/NodeTreeManager";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import {
  countNodesRecursively,
  createElementTree,
  predictElementCount,
} from "./resources/utils";
import { DNTM } from "../src/NodeTreeManager/DNTM";
import {
  AbstractDependentWraplet,
  AbstractWraplet,
  Status,
  WrapletDependencyMap,
} from "../src";
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

it("Test wraplet tree manager initialization performance", async () => {
  class TestWrapletDependency extends AbstractWraplet<Element> {}

  const map = {
    dependency: {
      selector: `[data-id-0-1-0-0]`,
      multiple: false,
      Class: TestWrapletDependency,
      required: true,
    },
  } satisfies WrapletDependencyMap;

  class TestWraplet extends AbstractDependentWraplet<Node, typeof map> {
    public static create(node: ParentNode, attribute: string): TestWraplet[] {
      return TestWraplet.createDependentWraplets(node, attribute, map);
    }
  }

  const treeData = {
    depth: 6,
    childrenPerNode: 8,
  };

  const tree = createElementTree(treeData.depth, treeData.childrenPerNode);
  document.body.appendChild(tree);

  const manager: NodeTreeManager = new DNTM();

  manager.addNodeInitializer(async (node): Promise<void> => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }

    const wraplets = TestWraplet.create(node, "data-id-0-1");
    for (const wraplet of wraplets) {
      await wraplet.wraplet.initialize();
    }
  });

  const startTime = performance.now();
  await manager.initializeNode(tree);
  const endTime = performance.now();

  expect(countNodesRecursively(tree)).toBe(
    predictElementCount(treeData.depth, treeData.childrenPerNode),
  );
  expect(endTime - startTime).toBeLessThan(1000);
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
