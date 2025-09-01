import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { ChildInstance } from "../src/types/ChildInstance";
import { ChildrenAreNotAvailableError } from "../src/errors";
import {
  defaultGroupableAttribute,
  GroupExtractor,
} from "../src/types/Groupable";

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

describe("Wraplet initialization", () => {
  it("Test wraplet node is required", () => {
    class TestWraplet extends AbstractWraplet {
      protected defineChildrenMap(): {} {
        return {};
      }
    }
    const func = () => {
      new TestWraplet(undefined as any);
    };
    expect(func).toThrow(Error);
  });

  it("Test AbstractWraplet instantiation is prohibited", () => {
    const func = () => {
      (AbstractWraplet as any).createWraplets(undefined, undefined);
    };
    expect(func).toThrow(Error);
  });

  it("Test wraplet initialization", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
    expect(wraplet).toBeTruthy();
  });

  it("Test multiple wraplets initialization", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div><div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplets = TestWraplet.createAll(testWrapletSelectorAttribute);
    expect(wraplets.length).toEqual(2);
  });

  it("Test wraplet has element", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const wraplet = TestWraplet.create<TestWraplet>(
      testWrapletSelectorAttribute,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    expect(wraplet.hasNode()).toBeTruthy();
  });

  it("Test wraplet's element is accessible", () => {
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

  it("Test wraplet create matches the top element", () => {
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

  it("Test wraplet child instantiate listener", () => {
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
        if (!this.isChildInstance(child, id)) {
          throw new Error("Invalid child instance.");
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

  it("Test wraplet initialization status", () => {
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

  it("Test that proper errors are thrown when accessing children when they are instantiated or not", () => {
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
        return this.childrenManager.uninitializedChildren;
      }
      public getChildrenInitialized() {
        return this.children;
      }
      protected initialize() {
        // Disable default initialization.
      }
      public init() {
        this.childrenManager.init();
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
});

it("Test wraplet syncing children", () => {
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
      this.childrenManager.syncChildren();
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

  const newChildElement = document.createElement("div");
  newChildElement.setAttribute(childrenAttribute, "");
  mainElement.appendChild(newChildElement);

  const newSingleChildElement = document.createElement("div");
  newSingleChildElement.setAttribute(childAttribute, "");
  mainElement.appendChild(newSingleChildElement);

  function expectations(wraplet: TestWraplet) {
    // Make sure that "children" has only two elements.
    expect(wraplet.getChild("children").size).toBe(2);
    // Make sure that only two children wraplets have been initialized.
    expect(funcInstantiateChildren).toHaveBeenCalledTimes(2);
    expect(funcInstantiateSingleChild).toHaveBeenCalledTimes(1);
  }

  const topChildrenBefore = wraplet.getChildrenArray();
  const childrenBefore = wraplet.getChild("children");

  // Test if syncing is idempotent.
  wraplet.syncChildren();
  expectations(wraplet);
  wraplet.syncChildren();
  expectations(wraplet);

  const topChildrenAfter = wraplet.getChildrenArray();
  const childrenAfter = wraplet.getChild("children");

  // We make sure that the arrays didn't change.
  expect(topChildrenBefore).toBe(topChildrenAfter);
  expect(childrenBefore).toBe(childrenAfter);
});

describe("Test wraplet groupable", () => {
  const customGroupableAttribute = "data-custom-groupable";

  class TestWrapletChild extends AbstractWraplet<{}, Element> {
    public getValue(): string | null {
      return this.node.getAttribute("data-value");
    }
    protected defineChildrenMap(): {} {
      return {};
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
    child3: {
      selector: `[data-child-3]`,
      multiple: false,
      Class: TestWrapletChild,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof map> {
    protected defineChildrenMap(): typeof map {
      return map;
    }
  }
  document.body.innerHTML = `
<div data-parent>
    <div data-child-1 ${defaultGroupableAttribute}="group1,group2" ${customGroupableAttribute}="group1"></div>
    <div data-child-2 ${defaultGroupableAttribute}="group2" ${customGroupableAttribute}="group1,group2"></div>
    <div data-child-3></div>
</div>
`;

  const wraplet = TestWraplet.create<TestWraplet>("data-parent", [], document);
  if (!wraplet) {
    throw new Error("Wraplets not created.");
  }

  const child1 = wraplet.getChild("child1");
  const child2 = wraplet.getChild("child2");
  const child3 = wraplet.getChild("child3");

  it("Test wraplet groupable default groups attribute", () => {
    expect(child1.getGroups()).toEqual(["group1", "group2"]);
    expect(child2.getGroups()).toEqual(["group2"]);
    expect(child3.getGroups()).toEqual([]);
  });

  it("Test wraplet groupable custom groups attribute", () => {
    const newGroupExtractor: GroupExtractor = (node: Node) => {
      if (!(node instanceof Element)) {
        throw new Error("The node is not an element.");
      }
      const value = node.getAttribute(customGroupableAttribute);
      if (!value) {
        throw new Error(
          "The element does not have a custom groupable attribute.",
        );
      }
      return value.split(",");
    };

    child1.setGroupsExtractor(newGroupExtractor);
    child2.setGroupsExtractor(newGroupExtractor);

    expect(child1.getGroups()).toEqual(["group1"]);
    expect(child2.getGroups()).toEqual(["group1", "group2"]);
  });
});

it("Test wraplet NodeTreeParent interface", () => {
  const attribute = "data-test-wraplet";
  class TestWrapletChild extends AbstractWraplet<{}, Element> {
    protected defineChildrenMap(): {} {
      return {};
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
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof map> {
    protected defineChildrenMap(): typeof map {
      return map;
    }
  }

  document.body.innerHTML = `
<div ${attribute}>
  <div data-child-1></div>
  <div data-child-2></div>
  <div data-children></div>
  <div data-children></div>
</div>
`;
  const wraplet = TestWraplet.create<TestWraplet>(attribute);
  if (!wraplet) {
    throw new Error("Wraplets not created.");
  }

  const nodeTreeChildren = wraplet.getNodeTreeChildren();
  expect(nodeTreeChildren.length).toBe(4);
});

it("Test wraplet groupable when node is not an element", () => {
  class TestWraplet extends AbstractWraplet {
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const node = document.createTextNode("test");
  const wraplet = new TestWraplet(node);
  const groups = wraplet.getGroups();

  expect(groups).toEqual([]);
});

it("Test wraplet map children args", () => {
  class TestWrapletChild extends AbstractWraplet {
    constructor(
      node: Node,
      public arg1: string,
    ) {
      super(node);
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const arg1Value = "arg1";

  const map = {
    child: {
      selector: `[data-child]`,
      multiple: false,
      Class: TestWrapletChild,
      required: true,
      args: [arg1Value],
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof map> {
    protected defineChildrenMap(): typeof map {
      return map;
    }

    public getChildArg1Value(): string {
      return this.children.child.arg1;
    }
  }

  document.body.innerHTML = `
<div data-wraplet>
  <div data-child></div>
</div>
`;

  const wraplet = TestWraplet.create<TestWraplet>("data-wraplet");
  if (!wraplet) {
    throw new Error("Wraplet not created.");
  }

  expect(wraplet.getChildArg1Value()).toEqual(arg1Value);
});
