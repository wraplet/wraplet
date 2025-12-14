import "./setup";
import { NodeTreeManager } from "../src/NodeTreeManager/NodeTreeManager";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import {
  countNodesRecursively,
  createElementTree,
  predictElementCount,
} from "./resources/utils";
import DefaultNodeTreeManager from "../src/NodeTreeManager/DefaultNodeTreeManager";
import { AbstractWraplet, Wraplet, WrapletChildrenMap } from "../src";
import { isParentNode } from "../src/NodeTreeManager/utils";
import { WrapletSymbol } from "../src/Core/types/Wraplet";

it("Test default node tree manager destroy tree", async () => {
  const func = jest.fn();

  class TestWraplet extends BaseElementTestWraplet {
    public async destroy() {
      func();
      await super.destroy();
    }
  }

  const attribute = "data-test-selector";

  document.body.innerHTML = `
<div ${attribute}>
    <div ${attribute}></div>
</div>`;

  const manager: NodeTreeManager = new DefaultNodeTreeManager();

  manager.addWrapletInitializer(async (node) => {
    if (!isParentNode(node)) {
      return [];
    }

    const wraplets = TestWraplet.createAll(attribute, {}, node);
    for (const wraplet of wraplets) {
      await wraplet.initialize();
    }

    return wraplets;
  });

  await manager.initializeNodeTree(document);

  const element = document.querySelector(`[${attribute}]`) as Element;
  await manager.destroyNodeTree(element);

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

  const manager: NodeTreeManager = new DefaultNodeTreeManager();
  const func = jest.fn();
  manager.addWrapletInitializer(async (node: Node) => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }
    func();
    const wraplet = TestWraplet.create(attribute, {}, node);
    if (!wraplet) {
      throw new Error("Wraplet not created.");
    }
    await wraplet.initialize();
    return [wraplet];
  });

  await manager.initializeNodeTree(element);

  if (!element.wraplets) {
    throw new Error("No wraplets found in the element.");
  }

  expect(func).toHaveBeenCalledTimes(1);
  expect(element.wraplets.size).toBeDefined();
  expect(element.wraplets.size).toBe(1);
});

it("Test wraplet tree manager initialization performance", async () => {
  class TestWrapletChild extends AbstractWraplet<Element> {}

  const map = {
    child: {
      selector: `[data-id-0-1-0-0]`,
      multiple: false,
      Class: TestWrapletChild,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends AbstractWraplet<Node, typeof map> {
    public static create(node: ParentNode, attribute: string): TestWraplet[] {
      return TestWraplet.createWraplets(node, map, attribute);
    }
  }

  const treeData = {
    depth: 6,
    childrenPerNode: 8,
  };

  const tree = createElementTree(treeData.depth, treeData.childrenPerNode);
  document.body.appendChild(tree);

  const manager: NodeTreeManager = new DefaultNodeTreeManager();

  manager.addWrapletInitializer(async (node): Promise<Wraplet[]> => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }

    const wraplets = TestWraplet.create(node, "data-id-0-1");
    for (const wraplet of wraplets) {
      await wraplet.initialize();
    }
    return wraplets;
  });

  const startTime = performance.now();
  await manager.initializeNodeTree(tree);
  const endTime = performance.now();

  expect(countNodesRecursively(tree)).toBe(
    predictElementCount(treeData.depth, treeData.childrenPerNode),
  );
  expect(endTime - startTime).toBeLessThan(1000);
});

it("Test searching for wraplets in the node tree manager", async () => {
  class TestWrapletChild extends AbstractWraplet<Element> {
    public getValue(): string | null {
      return this.node.getAttribute("data-value");
    }
  }

  const map = {
    child1: {
      selector: `[data-child-1]`,
      multiple: false,
      Class: TestWrapletChild,
      required: true,
    },
    child2: {
      selector: `[data-child-2]`,
      multiple: false,
      Class: TestWrapletChild,
      required: true,
    },
    children: {
      selector: `[data-children]`,
      multiple: true,
      Class: TestWrapletChild,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends AbstractWraplet<Node, typeof map> {
    public static create(node: ParentNode, attribute: string): TestWraplet[] {
      return TestWraplet.createWraplets(node, map, attribute);
    }
  }

  document.body.innerHTML = `
<div data-parent>
    <div data-child-1 data-value="1"></div>
    <div data-child-2></div>
    <div data-children></div>
    <div data-children></div>
</div>
`;

  const manager = new DefaultNodeTreeManager();
  manager.addWrapletInitializer(async (node: Node) => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }
    const wraplets = TestWraplet.create(node, "data-parent");
    if (!wraplets) {
      throw new Error("Wraplets not created.");
    }
    for (const wraplet of wraplets) {
      await wraplet.initialize();
    }
    return wraplets;
  });

  await manager.initializeNodeTree(document);

  const set = manager.getSet();

  // Test findOne.
  const wraplet = set.findOne((item) => {
    return item instanceof TestWraplet;
  });
  if (!wraplet) {
    throw new Error("Wraplet not found.");
  }
  expect(wraplet).toBeInstanceOf(TestWraplet);

  // Test find.
  const items = set.find((item: Wraplet) => {
    if (item instanceof TestWraplet) {
      return true;
    } else if (item instanceof TestWrapletChild) {
      return item.getValue() === "1";
    }

    return false;
  });

  // We don't use "toHaveLength" because jest would attempt to display values of the properties, of items, which would
  // result in error because "children" properties access is validated.
  expect(items.length).toBe(2);
});

it("Test initializing non-tree-parent wraplet", async () => {
  class TestWraplet implements Wraplet {
    [WrapletSymbol]: true = true;
    isGettingInitialized: boolean = false;
    isInitialized: boolean = true;
    isDestroyed: boolean = false;
    isGettingDestroyed: boolean = false;
    accessNode(): void {}
    async initialize() {}
    async destroy() {}
    addDestroyListener(): void {}
  }

  const manager = new DefaultNodeTreeManager();
  manager.addWrapletInitializer(async (node: Node) => {
    if (!(node instanceof Document)) {
      throw new Error("Node is not a Document");
    }
    const wraplet = new TestWraplet();
    await wraplet.initialize();
    return [wraplet];
  });

  await manager.initializeNodeTree(document);

  const set = manager.getSet();

  // Test findOne.
  const wraplet = set.findOne((item) => {
    return item instanceof TestWraplet;
  });
  if (!wraplet) {
    throw new Error("Wraplet not found.");
  }
  expect(wraplet).toBeInstanceOf(TestWraplet);
});
