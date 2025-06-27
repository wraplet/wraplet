import "./setup";

import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletChildSelectorSingleAttribute =
  "data-test-child-selector-single";
const testWrapletChildSelectorSingleOptionalAttribute =
  "data-test-child-selector-single-optional";
const testWrapletChildSelectorIndestructibleAttribute =
  "data-test-child-indestructible";
const testWrapletChildSelectorMultipleAttribute =
  "data-test-child-selector-multiple";

class TestWrapletChild extends AbstractWraplet<{}, Node> {
  public static counter: number = 0;

  protected defineChildrenMap(): {} {
    return {};
  }
  destroy() {
    this.constructor.prototype.constructor.counter++;
    super.destroy();
  }
}

const childrenMap = {
  child: {
    selector: `[${testWrapletChildSelectorSingleAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: true,
  },
  childIndestuctible: {
    selector: `[${testWrapletChildSelectorIndestructibleAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: true,
    destructable: false,
  },
  childOptional: {
    selector: `[${testWrapletChildSelectorSingleOptionalAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: false,
  },
  children: {
    selector: `[${testWrapletChildSelectorMultipleAttribute}]`,
    Class: TestWrapletChild,
    multiple: true,
    required: true,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
  destroy() {
    super.destroy();
  }
}

test("Test that 'destroy' is invoked on all children", () => {
  document.body.innerHTML = `
<div ${testWrapletSelectorAttribute}>
    <div ${testWrapletChildSelectorSingleAttribute}></div>
    <div ${testWrapletChildSelectorIndestructibleAttribute}></div>    
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
</div>
`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  wraplet?.destroy();
  expect(TestWrapletChild.counter).toEqual(5);
  TestWrapletChild.counter = 0;
});

test("Test that children are removed from the nodes after being destroyed", () => {
  document.body.innerHTML = `
<div ${testWrapletSelectorAttribute}>
    <div ${testWrapletChildSelectorSingleAttribute}></div>
    <div ${testWrapletChildSelectorIndestructibleAttribute}></div>    
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
    <div ${testWrapletChildSelectorMultipleAttribute}></div>
</div>
`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  wraplet?.destroy();
  const elements = document.querySelectorAll("*");

  for (const element of elements) {
    if (!element.wraplets) {
      continue;
    }
    if (element.hasAttribute(testWrapletChildSelectorIndestructibleAttribute)) {
      expect(element.wraplets.length).toEqual(1);
    } else {
      expect(element.wraplets.length).toEqual(0);
    }
  }
});

test("Test that listeneres are being detached during destruction", () => {
  const listener = jest.fn();
  class TestWrapletChild extends AbstractWraplet {
    constructor(node: Element) {
      super(node);

      this.core.addEventListener(node, "click", () => {
        listener();
      });
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }
  const mainAttribute = "data-test-main";
  const childAttribute = "data-test-child";
  const childrenMap = {
    child: {
      selector: `[${childAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    protected defineChildrenMap(): typeof childrenMap {
      return childrenMap;
    }
  }

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${childAttribute}></div>
</div>
`;

  const main = TestWraplet.create<TestWraplet>(mainAttribute);

  if (!main) {
    throw new Error("Wraplet not initialized.");
  }

  const child = main.getChild("child");
  if (!child) {
    throw new Error("Child not found.");
  }

  const childNode = document.querySelector(`[${childAttribute}]`) as Element;
  childNode.dispatchEvent(new Event("click"));
  main.destroy();
  childNode.dispatchEvent(new Event("click"));

  expect(listener).toHaveBeenCalledTimes(1);
});
