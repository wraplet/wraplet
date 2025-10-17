import "./setup";

import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { RequiredChildDestroyedError } from "../src/errors";
import { ChildInstance } from "../src/types/ChildInstance";
import { Core } from "../src/types/Core";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletChildSelectorSingleAttribute =
  "data-test-child-selector-single";
const testWrapletChildSelectorSingleOptionalAttribute =
  "data-test-child-selector-single-optional";
const testWrapletChildSelectorIndestructibleAttribute =
  "data-test-child-indestructible";
const testWrapletChildSelectorMultipleAttribute =
  "data-test-child-selector-multiple";

class TestWrapletChild extends AbstractWraplet {
  public static counter: number = 0;

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
    required: false,
  },
  childIndestuctible: {
    selector: `[${testWrapletChildSelectorIndestructibleAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: false,
    destructible: false,
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
    required: false,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

it("Test that 'destroy' is invoked on all children", () => {
  document.body.innerHTML = `
<div ${testWrapletSelectorAttribute}>
    <div ${testWrapletChildSelectorSingleAttribute}  class="c1"></div>
    <div ${testWrapletChildSelectorIndestructibleAttribute} class="c-indestructible"></div>    
    <div ${testWrapletChildSelectorMultipleAttribute} class="c2"></div>
    <div ${testWrapletChildSelectorMultipleAttribute} class="c3"></div>
    <div ${testWrapletChildSelectorMultipleAttribute} class="c4"></div>
    <div ${testWrapletChildSelectorMultipleAttribute} class="c5"></div>
</div>
`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute, childrenMap);
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  wraplet.destroy();
  expect(TestWrapletChild.counter).toEqual(5);
  TestWrapletChild.counter = 0;
});

it("Test that children are removed from the nodes after being destroyed", () => {
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
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute, childrenMap);
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  wraplet.destroy();
  const elements = document.querySelectorAll("*");

  for (const element of elements) {
    if (!element.wraplets) {
      continue;
    }
    if (element.hasAttribute(testWrapletChildSelectorIndestructibleAttribute)) {
      expect(element.wraplets.size).toEqual(1);
    } else {
      expect(element.wraplets.size).toEqual(0);
    }
  }
});

it("Test that listeneres are being detached during destruction", () => {
  const listener = jest.fn();
  class TestWrapletChild extends AbstractWraplet {
    constructor(core: Core) {
      super(core);

      this.core.addEventListener(this.node, "click", () => {
        listener();
      });
    }
  }
  const mainAttribute = "data-test-main";
  const childAttribute = "data-test-child";
  const childrenMap = {
    child: {
      selector: `[${childAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${childAttribute}></div>
</div>
`;

  const main = TestWraplet.create<typeof childrenMap, TestWraplet>(
    mainAttribute,
    childrenMap,
  );

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

it("Test that if the required child has been destroyed then throw exception", () => {
  const mainAttribute = "data-test-main";
  const childAttribute = "data-test-child";

  class TestWrapletChild extends AbstractWraplet {
    public destroy() {
      super.destroy();
    }
  }

  const childrenMap = {
    child: {
      selector: `[${childAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${childAttribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
    mainAttribute,
    childrenMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }

  const child = wraplet.getChild("child");
  if (!child) {
    throw new Error("Child not found.");
  }

  expect(() => {
    child.destroy();
  }).toThrow(RequiredChildDestroyedError);
});

it("Destroy child listener", () => {
  const mainAttribute = "data-test-main";
  const childAttribute = "data-test-child";

  const func = jest.fn();

  class TestWrapletChild extends AbstractWraplet {
    public destroy() {
      super.destroy();
    }
  }

  const childrenMap = {
    child: {
      selector: `[${childAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    protected onChildDestroyed<K extends keyof typeof childrenMap>(
      child: ChildInstance<typeof childrenMap, K>,
      id: K,
    ) {
      expect(id).toEqual("child");
      expect(child).toBeInstanceOf(TestWrapletChild);
      func();
    }
  }

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${childAttribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
    mainAttribute,
    childrenMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  const child = wraplet.getChild("child");
  if (!child) {
    throw new Error("Child not found.");
  }
  child.destroy();

  expect(func).toHaveBeenCalledTimes(1);
});

it("Test isDestroyed values", () => {
  const mainAttribute = "data-test-main";
  const childAttribute = "data-test-child";

  class TestWrapletChild extends AbstractWraplet {}

  const childrenMap = {
    child: {
      selector: `[${childAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    protected onChildDestroyed() {
      expect(this.isGettingDestroyed).toBe(true);
      expect(this.isDestroyed).toBe(false);
    }
  }

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${childAttribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
    mainAttribute,
    childrenMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  expect(wraplet.isGettingDestroyed).toBe(false);
  expect(wraplet.isDestroyed).toBe(false);
  wraplet.destroy();
  expect(wraplet.isDestroyed).toBe(true);
});
