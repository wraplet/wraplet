import "./setup";
import {
  AbstractWraplet,
  getGlobalWrapletManager,
  WrapletChildrenMap,
} from "../src";
import { WrapletManager } from "../src/types/WrapletManager";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { isParentNode } from "./resources/utils";

test("Test global wraplet manager availability", () => {
  const manager: WrapletManager = getGlobalWrapletManager();
  expect(manager).toBeTruthy();
});

test("Test global wraplet manager destroy tree", () => {
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
  const manager: WrapletManager = getGlobalWrapletManager();

  const element = document.querySelector(`[${attribute}]`) as Element;
  manager.destroyNodeTree(element);

  expect(func).toHaveBeenCalledTimes(2);
});

test("Test global wraplet manager initialize tree", () => {
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

  const manager: WrapletManager = getGlobalWrapletManager();
  const func = jest.fn();
  manager.addWrapletInitializer((node: Node) => {
    if (!isParentNode(node)) {
      throw new Error("Node is not parent node.");
    }
    TestWraplet.create(attribute, [], node);
    func();
  });

  manager.initializeNodeTree(element);

  expect(func).toHaveBeenCalledTimes(1);
  expect(element.wraplets).toBeDefined();
  expect(element.wraplets).toHaveLength(1);
});

test("Test syncing children", () => {
  const mainAttribute = "data-main-wraplet";
  const childrenAttribute = "data-children-wraplet";
  const childAttribute = "data-child-wraplet";

  const funcInstantiateChildren = jest.fn();
  const funcInstantiateSingleChild = jest.fn();

  class TestWrapletChild extends AbstractWraplet {
    constructor(element: Element) {
      funcInstantiateChildren();
      super(element);
    }
    protected defineChildrenMap() {
      return {};
    }
  }

  class TestWrapletSingleChild extends AbstractWraplet {
    constructor(element: Element) {
      funcInstantiateSingleChild();
      super(element);
    }
    protected defineChildrenMap() {
      return {};
    }
  }

  const childrenMap = {
    children: {
      selector: `[${childrenAttribute}]`,
      Class: TestWrapletChild,
      multiple: true,
      required: true,
    },
    singleChild: {
      selector: `[${childAttribute}]`,
      Class: TestWrapletSingleChild,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    public syncChildren(): void {
      this.core.syncChildren();
    }
    protected defineChildrenMap(): typeof childrenMap {
      return childrenMap;
    }
    public getChildrenArray() {
      return this.children;
    }
  }

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${childrenAttribute}></div>
</div>
`;

  const mainElement = document.querySelector(`[${mainAttribute}]`);
  if (!mainElement) {
    throw Error("The main element has not been found.");
  }

  const wraplet = TestWraplet.create<TestWraplet>(mainAttribute);
  if (!wraplet) {
    throw new Error("The main wraplet has not been created.");
  }

  const manager: WrapletManager = getGlobalWrapletManager();
  manager.addWrapletInitializer(() => {
    // Re-sync children after node has been updated.
    wraplet.syncChildren();
  });

  const newChildElement = document.createElement("div");
  newChildElement.setAttribute(childrenAttribute, "");
  mainElement.appendChild(newChildElement);

  const newSingleChildElement = document.createElement("div");
  newSingleChildElement.setAttribute(childAttribute, "");
  mainElement.appendChild(newSingleChildElement);

  function expectations(wraplet: TestWraplet) {
    // Make sure that "children" has only two elements.
    expect(wraplet.getChild("children")).toHaveLength(2);
    // Make sure that only two children wraplets have been initialized.
    expect(funcInstantiateChildren).toHaveBeenCalledTimes(2);
    expect(funcInstantiateSingleChild).toHaveBeenCalledTimes(1);
  }

  const topChildrenBefore = wraplet.getChildrenArray();
  const childrenBefore = wraplet.getChild("children");

  manager.initializeNodeTree(newChildElement);
  expectations(wraplet);

  // We make sure that running initialization multiple times don't break our results.
  manager.initializeNodeTree(newChildElement);
  expectations(wraplet);

  const topChildrenAfter = wraplet.getChildrenArray();
  const childrenAfter = wraplet.getChild("children");

  // We make sure that the arrays didn't change.
  expect(topChildrenBefore).toBe(topChildrenAfter);
  expect(childrenBefore).toBe(childrenAfter);
});
