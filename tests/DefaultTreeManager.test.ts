import "./setup";
import { NodeTreeManager } from "../src/types/NodeTreeManager";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import {
  countNodesRecursively,
  createElementTree,
  isParentNode,
  predictElementCount,
} from "./resources/utils";
import DefaultNodeTreeManager from "../src/NodeTreeManager/DefaultNodeTreeManager";
import {AbstractWraplet, Wraplet, WrapletChildrenMap} from "../src";

test("Test default node tree manager destroy tree", () => {
  const func = jest.fn();

  class TestWraplet extends BaseElementTestWraplet {
    protected defineChildrenMap(): {} {
      return {};
    }
    public destroy() {
      func();
      super.destroy();
    }
  }

  const attribute = "data-test-selector";

  document.body.innerHTML = `
<div ${attribute}>
    <div ${attribute}></div>
</div>`;

  TestWraplet.create(attribute);
  const manager: NodeTreeManager = new DefaultNodeTreeManager();

  const element = document.querySelector(`[${attribute}]`) as Element;
  manager.destroyNodeTree(element);

  expect(func).toHaveBeenCalledTimes(2);
});

test("Test default node tree manager initialize tree", () => {
  class TestWraplet extends BaseElementTestWraplet {
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  document.body.innerHTML = `
<div></div>
  `;

  const attribute = "data-test-selector";

  const element = document.createElement("div");
  element.setAttribute(attribute, "");

  const manager: NodeTreeManager = new DefaultNodeTreeManager();
  const func = jest.fn();
  manager.addWrapletInitializer((node: Node) => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }
    func();
    TestWraplet.create(attribute, [], node);
  });

  manager.initializeNodeTree(element);

  expect(func).toHaveBeenCalledTimes(1);
  expect(element.wraplets).toBeDefined();
  expect(element.wraplets).toHaveLength(1);
});

test("Test wraplet tree manager initialization performance", () => {

  class TestWrapletChild extends AbstractWraplet {
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const map = {
    child: {
      selector: `[data-id-0-1-0-0]`,
      multiple: false,
      Class: TestWrapletChild,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends AbstractWraplet<typeof map> {
    protected defineChildrenMap(): typeof map {
      return map;
    }

    public static create(node: ParentNode, attribute: string): TestWraplet[] {
      return TestWraplet.createWraplets(node, `[${attribute}]`);
    }
  }

  const treeData = {
    depth: 6,
    childrenPerNode: 8,
  };

  const tree = createElementTree(treeData.depth, treeData.childrenPerNode);
  document.body.appendChild(tree);

  const manager: NodeTreeManager = new DefaultNodeTreeManager();

  manager.addWrapletInitializer((node): Wraplet[] => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }

    return TestWraplet.create(node, "data-id-0-1");
  });

  const startTime = performance.now();
  manager.initializeNodeTree(tree);
  const endTime = performance.now();

  //console.log(countNodesRecursively(tree), endTime - startTime);

  expect(countNodesRecursively(tree)).toBe(
    predictElementCount(treeData.depth, treeData.childrenPerNode),
  );
  expect(endTime - startTime).toBeLessThan(1000);
});
