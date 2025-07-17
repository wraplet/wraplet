import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { ChildInstance } from "../src/types/ChildInstance";
import { ChildrenAreNotAvailableError } from "../src/errors";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

class TestWrapletChild extends AbstractWraplet<any> {
  protected defineChildrenMap(): {} {
    return {};
  }
}

const childrenMap = {
  child: {
    selector: `[${testWrapletChildSelectorAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: false,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }

  public hasNode(): boolean {
    return !!this.node;
  }
}

// TESTS START HERE

test("Test wraplet initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  expect(wraplet).toBeTruthy();
});

test("Test multiple wraplets initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div><div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplets = TestWraplet.createAll(testWrapletSelectorAttribute);
  expect(wraplets.length).toEqual(2);
});

test("Test wraplet has element", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.hasNode()).toBeTruthy();
});

test("Test wraplet's element is accessible", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  const callback = jest.fn((element: Element) => element);

  wraplet.accessNode((element) => {
    callback(element);
  });

  expect(callback).toHaveBeenCalledTimes(1);
});

test("Test wraplet create matches the top element", () => {
  const attribute = "data-test-selector";

  class TestWraplet extends AbstractWraplet {
    protected defineChildrenMap(): {} {
      return {};
    }

    public static create(node: ParentNode): TestWraplet {
      const wraplets = this.createWraplets<Node, TestWraplet>(
        node,
        `[${attribute}]`,
      );
      expect(wraplets.length).toEqual(1);

      return wraplets[0];
    }
  }

  const element = document.createElement("div");
  element.setAttribute(attribute, "");
  const wraplet = TestWraplet.create(element);
  expect(wraplet).toBeInstanceOf(TestWraplet);
});

test("Test wraplet child instantiate listener", () => {
  const attribute = "data-test-wraplet";
  const child1Attribute = `${attribute}-child1`;
  const child2Attribute = `${attribute}-child2`;

  const instatiatedFunc = jest.fn();

  class TestWrapletChild1 extends AbstractWraplet {
    public testMethod1(): boolean {
      instatiatedFunc();
      return true;
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  class TestWrapletChild2 extends AbstractWraplet {
    public testMethod2(): boolean {
      return true;
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const map = {
    child1: {
      selector: `[${child1Attribute}]`,
      Class: TestWrapletChild1,
      multiple: false,
      required: false,
    },
    child2: {
      selector: `[${child2Attribute}]`,
      Class: TestWrapletChild2,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof map> {
    protected defineChildrenMap(): typeof map {
      return map;
    }
    protected onChildInstantiated<K extends keyof typeof map>(
      child: ChildInstance<typeof map, K>,
      id: K,
    ) {
      if (this.isChildInstance(child, id, "child1")) {
        child.testMethod1();
      }
    }
  }

  document.body.innerHTML = `
<div ${attribute}>
    <div ${child1Attribute}></div>
    <div ${child2Attribute}></div>
</div>
`;

  TestWraplet.create<TestWraplet>(attribute);

  expect(instatiatedFunc).toHaveBeenCalledTimes(1);
});

test("Test wraplet initialization status", () => {
  const attribute = "data-test-wraplet";
  const child1Attribute = `${attribute}-child1`;

  let defaultStatus: boolean | null = null;

  class TestWrapletChild1 extends AbstractWraplet {
    public testMethod1(): boolean {
      return true;
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const map = {
    child1: {
      selector: `[${child1Attribute}]`,
      Class: TestWrapletChild1,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof map> {
    constructor(element: Element) {
      super(element);
    }
    protected defineChildrenMap(): typeof map {
      return map;
    }

    protected onChildInstantiated() {
      defaultStatus = this.isInitialized;
    }
  }

  document.body.innerHTML = `
<div ${attribute}>
    <div ${child1Attribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<TestWraplet>(attribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }

  expect(defaultStatus).toEqual(false);
  expect(wraplet.isInitialized).toEqual(true);
});

test("Test that proper errors are thrown when accessing children when they are instantiated or not", () => {
  const attribute = "data-test-wraplet";
  const child1Attribute = `${attribute}-child1`;

  class TestWrapletChild1 extends AbstractWraplet {
    public testMethod1(): boolean {
      return true;
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const map = {
    child1: {
      selector: `[${child1Attribute}]`,
      Class: TestWrapletChild1,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof map> {
    protected defineChildrenMap(): typeof map {
      return map;
    }
    public getChildrenUninitialized() {
      return this.core.uninitializedChildren;
    }
    public getChildrenInitialized() {
      return this.children;
    }
    protected initialize() {
      // Disable default initialization.
    }
    public init() {
      this.core.init();
    }
  }

  document.body.innerHTML = `
<div ${attribute}>
    <div ${child1Attribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<TestWraplet>(attribute);
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }

  const funcInitialized = () => {
    wraplet.getChildrenInitialized();
  };
  const funcUninitialized = () => {
    wraplet.getChildrenUninitialized();
  };

  expect(funcUninitialized).not.toThrow();
  expect(funcInitialized).toThrow(ChildrenAreNotAvailableError);
  wraplet.init();
  expect(funcUninitialized).toThrow(ChildrenAreNotAvailableError);
  expect(funcInitialized).not.toThrow();
});
