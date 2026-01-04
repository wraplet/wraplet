import "./setup";
import {
  AbstractWraplet,
  customizeDefaultWrapletApi,
  DefaultCore,
  destructionCompleted,
  destructionStarted,
  initializationCompleted,
  initializationStarted,
  Status,
  WrapletChildrenMap,
} from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { ChildInstance } from "../src/Wraplet/types/ChildInstance";
import {
  defaultGroupableAttribute,
  GroupExtractor,
} from "../src/types/Groupable";
import { Core } from "../src";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

class TestWrapletChild extends AbstractWraplet {}

const childrenMap = {
  child: {
    selector: `[${testWrapletChildSelectorAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: false,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
  public hasNode(): boolean {
    return !!this.node;
  }
}

describe("AbstractWraplet", () => {
  describe("Instantiation & Initialization", () => {
    it("should require a node for initialization", () => {
      class TestWraplet extends AbstractWraplet {}
      const func = () => {
        new TestWraplet(undefined as any);
      };
      expect(func).toThrow(Error);
    });

    it("should prohibit direct AbstractWraplet instantiation", () => {
      const func = () => {
        (AbstractWraplet as any).createWraplets(undefined, undefined);
      };
      expect(func).toThrow(Error);
    });

    it("should initialize a wraplet successfully", () => {
      document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        childrenMap,
      );
      expect(wraplet).toBeTruthy();
    });

    it("should initialize multiple wraplets successfully", () => {
      document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div><div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
      const wraplets = TestWraplet.createAll(testWrapletSelectorAttribute);
      expect(wraplets.length).toEqual(2);
    });

    it("should match the top element during creation", () => {
      const attribute = "data-test-selector";

      class TestWraplet extends AbstractWraplet {
        public static create(node: ParentNode): TestWraplet {
          const wraplets = this.createWraplets<Node, TestWraplet>(
            node,
            {},
            attribute,
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
  });

  describe("Node Access", () => {
    it("should confirm the wraplet has an element", () => {
      document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
      const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
        testWrapletSelectorAttribute,
        childrenMap,
      );
      if (!wraplet) {
        throw Error("Wraplet not initialized.");
      }
      expect(wraplet.hasNode()).toBeTruthy();
    });

    it("should allow access to the wraplet's element", () => {
      document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        childrenMap,
      );
      if (!wraplet) {
        throw Error("Wraplet not initialized.");
      }
      const callback = jest.fn((element: Element) => element);

      wraplet.wraplet.accessNode((element) => {
        callback(element);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Child Management", () => {
    it("should trigger listener on child instantiation", async () => {
      const attribute = "data-test-wraplet";
      const child1Attribute = `${attribute}-child1`;
      const child2Attribute = `${attribute}-child2`;

      const instatiatedFunc = jest.fn();

      class TestWrapletChild1 extends AbstractWraplet {
        public testMethod1(): boolean {
          instatiatedFunc();
          return true;
        }
      }

      class TestWrapletChild2 extends AbstractWraplet {
        public testMethod2(): boolean {
          return true;
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
        protected onChildInstantiate<K extends keyof typeof map>(
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

      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        attribute,
        map,
      );
      if (!wraplet) {
        throw Error("Wraplet not created.");
      }
      await wraplet.wraplet.initialize();

      expect(instatiatedFunc).toHaveBeenCalledTimes(1);
    });

    it("should not throw errors when accessing children whether they are instantiated or not", async () => {
      const attribute = "data-test-wraplet";
      const child1Attribute = `${attribute}-child1`;

      class TestWrapletChild1 extends AbstractWraplet {
        public testMethod1(): boolean {
          return true;
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
        public getChildrenInstantiated() {
          return this.children;
        }
      }

      document.body.innerHTML = `
<div ${attribute}>
    <div ${child1Attribute}></div>
</div>
`;

      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        attribute,
        map,
      );
      if (!wraplet) {
        throw new Error("Wraplet not initialized.");
      }

      const funcInstantiated = () => {
        wraplet.getChildrenInstantiated();
      };

      expect(funcInstantiated).not.toThrow();
      await wraplet.wraplet.initialize();
      // After initialization everything is still ok.
      expect(funcInstantiated).not.toThrow();
    });

    it("should pass arguments to children correctly", async () => {
      class TestWrapletChild extends AbstractWraplet {
        constructor(
          core: Core,
          public arg1: string,
        ) {
          super(core);
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
        public getChildArg1Value(): string {
          return this.children.child.arg1;
        }
      }

      document.body.innerHTML = `
<div data-wraplet>
  <div data-child></div>
</div>
`;
      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        "data-wraplet",
        map,
      );
      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }

      await wraplet.wraplet.initialize();

      expect(wraplet.getChildArg1Value()).toEqual(arg1Value);
    });
  });

  describe("Syncing", () => {
    it("should sync children correctly and be idempotent", async () => {
      const mainAttribute = "data-main-wraplet";
      const childrenAttribute = "data-children-wraplet";
      const childAttribute = "data-child-wraplet";

      const funcInstantiateChildren = jest.fn();
      const funcInstantiateSingleChild = jest.fn();

      class TestWrapletChild extends AbstractWraplet {
        constructor(core: Core) {
          funcInstantiateChildren();
          super(core);
        }
      }

      class TestWrapletSingleChild extends AbstractWraplet {
        constructor(core: Core) {
          funcInstantiateSingleChild();
          super(core);
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
        public async syncChildren(): Promise<void> {
          await this.core.syncChildren();
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

      const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
        mainAttribute,
        childrenMap,
      );
      if (!wraplet) {
        throw new Error("The main wraplet has not been created.");
      }

      await wraplet.wraplet.initialize();

      // Test if syncing is idempotent.
      await wraplet.syncChildren();
      expect(wraplet.getChild("children").size).toBe(1);
      await wraplet.syncChildren();
      expect(wraplet.getChild("children").size).toBe(1);

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
      await wraplet.syncChildren();
      expectations(wraplet);
      await wraplet.syncChildren();
      expectations(wraplet);

      const topChildrenAfter = wraplet.getChildrenArray();
      const childrenAfter = wraplet.getChild("children");

      // We make sure that the arrays didn't change.
      expect(topChildrenBefore).toBe(topChildrenAfter);
      expect(childrenBefore).toBe(childrenAfter);
    });
  });

  describe("Groupable", () => {
    const customGroupableAttribute = "data-custom-groupable";

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
      child3: {
        selector: `[data-child-3]`,
        multiple: false,
        Class: TestWrapletChild,
        required: true,
      },
    } as const satisfies WrapletChildrenMap;

    class TestWraplet extends BaseElementTestWraplet<typeof map> {}

    beforeEach(() => {
      document.body.innerHTML = `
<div data-parent>
    <div data-child-1 ${defaultGroupableAttribute}="group1,group2" ${customGroupableAttribute}="group1"></div>
    <div data-child-2 ${defaultGroupableAttribute}="group2" ${customGroupableAttribute}="group1,group2"></div>
    <div data-child-3></div>
</div>
`;
    });

    it("should handle default groups attribute correctly", async () => {
      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        "data-parent",
        map,
      );
      if (!wraplet) {
        throw new Error("Wraplets not created.");
      }
      await wraplet.wraplet.initialize();

      const child1 = wraplet.getChild("child1");
      const child2 = wraplet.getChild("child2");
      const child3 = wraplet.getChild("child3");

      expect(child1.wraplet.getGroups()).toEqual(["group1", "group2"]);
      expect(child2.wraplet.getGroups()).toEqual(["group2"]);
      expect(child3.wraplet.getGroups()).toEqual([]);
    });

    it("should handle custom groups extractor correctly", async () => {
      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        "data-parent",
        map,
      );
      if (!wraplet) {
        throw new Error("Wraplets not created.");
      }
      await wraplet.wraplet.initialize();

      const child1 = wraplet.getChild("child1");
      const child2 = wraplet.getChild("child2");

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

      child1.wraplet.setGroupsExtractor(newGroupExtractor);
      child2.wraplet.setGroupsExtractor(newGroupExtractor);

      expect(child1.wraplet.getGroups()).toEqual(["group1"]);
      expect(child2.wraplet.getGroups()).toEqual(["group1", "group2"]);
    });

    it("should return empty groups when node is not an element", () => {
      class TestWraplet extends AbstractWraplet {
        constructor(node: Node) {
          super(new DefaultCore(node, {}));
        }
      }

      const node = document.createTextNode("test");
      const wraplet = new TestWraplet(node);
      const groups = wraplet.wraplet.getGroups();

      expect(groups).toEqual([]);
    });
  });

  describe("NodeTreeParent", () => {
    it("should correctly implement the NodeTreeParent interface", async () => {
      const attribute = "data-test-wraplet";
      class TestWrapletChild extends AbstractWraplet<Element> {}

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

      class TestWraplet extends BaseElementTestWraplet<typeof map> {}

      document.body.innerHTML = `
<div ${attribute}>
  <div data-child-1></div>
  <div data-child-2></div>
  <div data-children></div>
  <div data-children></div>
</div>
`;
      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        attribute,
        map,
      );
      if (!wraplet) {
        throw new Error("Wraplets not created.");
      }

      await wraplet.wraplet.initialize();

      const nodeTreeChildren = wraplet.wraplet.getNodeTreeChildren();
      expect(nodeTreeChildren.length).toBe(4);
    });
  });

  describe("Lifecycle", () => {
    it("should handle destruction scheduled during initialization", async () => {
      class TestWraplet extends AbstractWraplet {}

      const element = document.createElement("div");

      const core = new DefaultCore(element, {});
      const wraplet = new TestWraplet(core);

      const func = jest.fn();

      wraplet.wraplet
        .initialize()
        .then(async () => {
          func();
          // Make sure that wraplet is destroyed after initialization is complete.
          expect(wraplet.wraplet.status.isDestroyed).toBe(true);
          // We can run `destroy` multiple times without consequences.
          await expect(wraplet.wraplet.destroy()).resolves.not.toThrow();
        })
        .finally(() => {
          expect(func).toHaveBeenCalledTimes(1);
        });
      expect(wraplet.wraplet.status.isInitialized).toBe(false);
      expect(wraplet.wraplet.status.isGettingInitialized).toBe(true);
      wraplet.wraplet.destroy();
      // Destruction is scheduled after initialization.
      expect(wraplet.wraplet.status.isGettingInitialized).toBe(true);
      expect(wraplet.wraplet.status.isGettingDestroyed).toBe(true);
    });

    it("should support customized lifecycle callbacks", async () => {
      const initializerParent = jest.fn();
      const destroyParent = jest.fn();

      class TestWraplet extends AbstractWraplet<HTMLDivElement, typeof map> {
        private readonly status: Status = {
          isGettingInitialized: false,
          isDestroyed: false,
          isInitialized: false,
          isGettingDestroyed: false,
        };
        constructor(core: Core<HTMLDivElement, typeof map>) {
          super(core);

          this.wraplet = customizeDefaultWrapletApi(
            {
              status: this.status,
              initialize: this.initialize.bind(this),
              destroy: this.destroy.bind(this),
            },
            this.wraplet,
          );
        }

        async initialize(): Promise<void> {
          if (!(await initializationStarted(this.status, this.core))) {
            return;
          }
          initializerParent();
          await initializationCompleted(this.status, this.destroy);
        }

        async destroy(): Promise<void> {
          if (
            !(await destructionStarted(
              this.status,
              this.core,
              this,
              this.destroyListeners,
            ))
          ) {
            return;
          }
          destroyParent();
          await destructionCompleted(this.status);
        }

        getChild() {
          return this.children["child"];
        }
      }

      const initializerChild = jest.fn();

      class TestWrapletChild extends AbstractWraplet {
        private readonly status: Status = {
          isGettingInitialized: false,
          isDestroyed: false,
          isInitialized: false,
          isGettingDestroyed: false,
        };

        constructor(core: Core) {
          super(core);

          this.wraplet = customizeDefaultWrapletApi(
            {
              status: this.status,
              initialize: this.initialize.bind(this),
              destroy: this.destroy.bind(this),
            },
            this.wraplet,
          );
        }

        public async destroy(): Promise<void> {
          if (
            !(await destructionStarted(
              this.status,
              this.core,
              this,
              this.destroyListeners,
            ))
          ) {
            return;
          }
          // Do nothing.
          await destructionCompleted(this.status);
        }

        public async initialize(): Promise<void> {
          if (!(await initializationStarted(this.status, this.core))) {
            return;
          }
          initializerChild();
          await initializationCompleted(this.status, this.destroy);
        }
      }

      const element = document.createElement("div");
      element.innerHTML = `<div data-child></div>`;

      const map = {
        child: {
          selector: `[data-child]`,
          multiple: false,
          Class: TestWrapletChild,
          required: false,
        },
      } as const satisfies WrapletChildrenMap;

      const core = new DefaultCore<HTMLDivElement, typeof map>(element, map);
      const wraplet = new TestWraplet(core);

      await wraplet.initialize();

      const child = wraplet.getChild();
      if (!child) {
        throw new Error("Child not found.");
      }

      expect(initializerParent).toHaveBeenCalledTimes(1);
      expect(wraplet.wraplet.status.isInitialized).toBe(true);
      expect(child.wraplet.status.isInitialized).toBe(true);
      expect(initializerChild).toHaveBeenCalledTimes(1);

      await wraplet.destroy();
      expect(destroyParent).toHaveBeenCalledTimes(1);
      expect(wraplet.wraplet.status.isDestroyed).toBe(true);
      expect(child.wraplet.status.isDestroyed).toBe(true);
    });
  });
});
