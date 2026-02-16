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
  WrapletDependencyMap,
} from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { DependencyInstance } from "../src/Wraplet/types/DependencyInstance";
import {
  defaultGroupableAttribute,
  GroupExtractor,
} from "../src/types/Groupable";
import { Core } from "../src";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletDependencySelectorAttribute = `${testWrapletSelectorAttribute}-dependency`;

class TestWrapletDependency extends AbstractWraplet {}

const dependenciesMap = {
  dependency: {
    selector: `[${testWrapletDependencySelectorAttribute}]`,
    Class: TestWrapletDependency,
    multiple: false,
    required: false,
  },
} as const satisfies WrapletDependencyMap;

class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {
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
      document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletDependencySelectorAttribute}></div></div>`;
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        dependenciesMap,
      );
      expect(wraplet).toBeTruthy();
    });

    it("should initialize multiple wraplets successfully", () => {
      document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div><div ${testWrapletSelectorAttribute}><div ${testWrapletDependencySelectorAttribute}></div></div>`;
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
      const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
        testWrapletSelectorAttribute,
        dependenciesMap,
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
        dependenciesMap,
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

  describe("Dependency Management", () => {
    it("should trigger listener on dependency instantiation", async () => {
      const attribute = "data-test-wraplet";
      const dependency1Attribute = `${attribute}-dependency1`;
      const dependency2Attribute = `${attribute}-dependency2`;

      const instatiatedFunc = jest.fn();

      class TestWrapletDependency1 extends AbstractWraplet {
        public testMethod1(): boolean {
          instatiatedFunc();
          return true;
        }
      }

      class TestWrapletDependency2 extends AbstractWraplet {
        public testMethod2(): boolean {
          return true;
        }
      }

      const map = {
        dependency1: {
          selector: `[${dependency1Attribute}]`,
          Class: TestWrapletDependency1,
          multiple: false,
          required: false,
        },
        dependency2: {
          selector: `[${dependency2Attribute}]`,
          Class: TestWrapletDependency2,
          multiple: false,
          required: false,
        },
      } as const satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof map> {
        protected onDependencyInstantiated<K extends keyof typeof map>(
          dependency: DependencyInstance<typeof map, K>,
          id: K,
        ) {
          if (this.isDependencyInstance(dependency, id, "dependency1")) {
            dependency.testMethod1();
          }
          if (!this.isDependencyInstance(dependency, id)) {
            throw new Error("Invalid dependency instance.");
          }
        }
      }

      document.body.innerHTML = `
<div ${attribute}>
    <div ${dependency1Attribute}></div>
    <div ${dependency2Attribute}></div>
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

    it("should not throw errors when accessing dependencies whether they are instantiated or not", async () => {
      const attribute = "data-test-wraplet";
      const dependency1Attribute = `${attribute}-dependency1`;

      class TestWrapletDependency1 extends AbstractWraplet {
        public testMethod1(): boolean {
          return true;
        }
      }

      const map = {
        dependency1: {
          selector: `[${dependency1Attribute}]`,
          Class: TestWrapletDependency1,
          multiple: false,
          required: false,
        },
      } as const satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof map> {
        public getDependenciesInstantiated() {
          return this.deps;
        }
      }

      document.body.innerHTML = `
<div ${attribute}>
    <div ${dependency1Attribute}></div>
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
        wraplet.getDependenciesInstantiated();
      };

      expect(funcInstantiated).not.toThrow();
      await wraplet.wraplet.initialize();
      // After initialization everything is still ok.
      expect(funcInstantiated).not.toThrow();
    });

    it("should pass arguments to dependencies correctly", async () => {
      class TestWrapletDependency extends AbstractWraplet {
        constructor(
          core: Core,
          public arg1: string,
        ) {
          super(core);
        }
      }

      const arg1Value = "arg1";

      const map = {
        dependency: {
          selector: `[data-dependency]`,
          multiple: false,
          Class: TestWrapletDependency,
          required: true,
          args: [arg1Value],
        },
      } as const satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof map> {
        public getDependencyArg1Value(): string {
          return this.deps.dependency.arg1;
        }
      }

      document.body.innerHTML = `
<div data-wraplet>
  <div data-dependency></div>
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

      expect(wraplet.getDependencyArg1Value()).toEqual(arg1Value);
    });
  });

  describe("Syncing", () => {
    it("should sync dependencies correctly and be idempotent", async () => {
      const mainAttribute = "data-main-wraplet";
      const dependenciesAttribute = "data-dependencies-wraplet";
      const dependencyAttribute = "data-dependency-wraplet";

      const funcInstantiateDependencies = jest.fn();
      const funcInstantiateSingleDependency = jest.fn();

      class TestWrapletDependency extends AbstractWraplet {
        constructor(core: Core) {
          funcInstantiateDependencies();
          super(core);
        }
      }

      class TestWrapletSingleDependency extends AbstractWraplet {
        constructor(core: Core) {
          funcInstantiateSingleDependency();
          super(core);
        }
      }

      const dependenciesMap = {
        dependencies: {
          selector: `[${dependenciesAttribute}]`,
          Class: TestWrapletDependency,
          multiple: true,
          required: true,
        },
        singleDependency: {
          selector: `[${dependencyAttribute}]`,
          Class: TestWrapletSingleDependency,
          multiple: false,
          required: false,
        },
      } as const satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {
        public async syncDependencies(): Promise<void> {
          await this.core.syncDependencies();
        }
        public getDependenciesArray() {
          return this.deps;
        }
      }

      document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${dependenciesAttribute}></div>
</div>
`;

      const mainElement = document.querySelector(`[${mainAttribute}]`);
      if (!mainElement) {
        throw Error("The main element has not been found.");
      }

      const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
        mainAttribute,
        dependenciesMap,
      );
      if (!wraplet) {
        throw new Error("The main wraplet has not been created.");
      }

      await wraplet.wraplet.initialize();

      // Test if syncing is idempotent.
      await wraplet.syncDependencies();
      expect(wraplet.getDependency("dependencies").size).toBe(1);
      await wraplet.syncDependencies();
      expect(wraplet.getDependency("dependencies").size).toBe(1);

      const newDependencyElement = document.createElement("div");
      newDependencyElement.setAttribute(dependenciesAttribute, "");
      mainElement.appendChild(newDependencyElement);

      const newSingleDependencyElement = document.createElement("div");
      newSingleDependencyElement.setAttribute(dependencyAttribute, "");
      mainElement.appendChild(newSingleDependencyElement);

      function expectations(wraplet: TestWraplet) {
        // Make sure that "dependencies" has only two elements.
        expect(wraplet.getDependency("dependencies").size).toBe(2);
        // Make sure that only two dependencies wraplets have been initialized.
        expect(funcInstantiateDependencies).toHaveBeenCalledTimes(2);
        expect(funcInstantiateSingleDependency).toHaveBeenCalledTimes(1);
      }

      const topDependenciesBefore = wraplet.getDependenciesArray();
      const dependenciesBefore = wraplet.getDependency("dependencies");

      // Test if syncing is idempotent.
      await wraplet.syncDependencies();
      expectations(wraplet);
      await wraplet.syncDependencies();
      expectations(wraplet);

      const topDependenciesAfter = wraplet.getDependenciesArray();
      const dependenciesAfter = wraplet.getDependency("dependencies");

      // We make sure that the arrays didn't change.
      expect(topDependenciesBefore).toBe(topDependenciesAfter);
      expect(dependenciesBefore).toBe(dependenciesAfter);
    });
  });

  describe("Groupable", () => {
    const customGroupableAttribute = "data-custom-groupable";

    class TestWrapletDependency extends AbstractWraplet<Element> {
      public getValue(): string | null {
        return this.node.getAttribute("data-value");
      }
    }

    const map = {
      dependency1: {
        selector: `[data-dependency-1]`,
        multiple: false,
        Class: TestWrapletDependency,
        required: true,
      },
      dependency2: {
        selector: `[data-dependency-2]`,
        multiple: false,
        Class: TestWrapletDependency,
        required: true,
      },
      dependency3: {
        selector: `[data-dependency-3]`,
        multiple: false,
        Class: TestWrapletDependency,
        required: true,
      },
    } as const satisfies WrapletDependencyMap;

    class TestWraplet extends BaseElementTestWraplet<typeof map> {}

    beforeEach(() => {
      document.body.innerHTML = `
<div data-parent>
    <div data-dependency-1 ${defaultGroupableAttribute}="group1,group2" ${customGroupableAttribute}="group1"></div>
    <div data-dependency-2 ${defaultGroupableAttribute}="group2" ${customGroupableAttribute}="group1,group2"></div>
    <div data-dependency-3></div>
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

      const dependency1 = wraplet.getDependency("dependency1");
      const dependency2 = wraplet.getDependency("dependency2");
      const dependency3 = wraplet.getDependency("dependency3");

      expect(dependency1.wraplet.getGroups()).toEqual(["group1", "group2"]);
      expect(dependency2.wraplet.getGroups()).toEqual(["group2"]);
      expect(dependency3.wraplet.getGroups()).toEqual([]);
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

      const dependency1 = wraplet.getDependency("dependency1");
      const dependency2 = wraplet.getDependency("dependency2");

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

      dependency1.wraplet.setGroupsExtractor(newGroupExtractor);
      dependency2.wraplet.setGroupsExtractor(newGroupExtractor);

      expect(dependency1.wraplet.getGroups()).toEqual(["group1"]);
      expect(dependency2.wraplet.getGroups()).toEqual(["group1", "group2"]);
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
      class TestWrapletDependency extends AbstractWraplet<Element> {}

      const map = {
        dependency1: {
          selector: `[data-dependency-1]`,
          multiple: false,
          Class: TestWrapletDependency,
          required: true,
        },
        dependency2: {
          selector: `[data-dependency-2]`,
          multiple: false,
          Class: TestWrapletDependency,
          required: true,
        },
        dependencies: {
          selector: `[data-dependencies]`,
          multiple: true,
          Class: TestWrapletDependency,
          required: true,
        },
      } as const satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof map> {}

      document.body.innerHTML = `
<div ${attribute}>
  <div data-dependency-1></div>
  <div data-dependency-2></div>
  <div data-dependencies></div>
  <div data-dependencies></div>
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

      const nodeTreeDependencies = wraplet.wraplet.getChildrenDependencies();
      expect(nodeTreeDependencies.length).toBe(4);
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
          if (!(await initializationStarted(this.status, this.core, this))) {
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
          await destructionCompleted(this.status, this.core, this);
        }

        getDependency() {
          return this.deps["dependency"];
        }
      }

      const initializerDependency = jest.fn();

      class TestWrapletDependency extends AbstractWraplet {
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
          await destructionCompleted(this.status, this.core, this);
        }

        public async initialize(): Promise<void> {
          if (!(await initializationStarted(this.status, this.core, this))) {
            return;
          }
          initializerDependency();
          await initializationCompleted(this.status, this.destroy);
        }
      }

      const element = document.createElement("div");
      element.innerHTML = `<div data-dependency></div>`;

      const map = {
        dependency: {
          selector: `[data-dependency]`,
          multiple: false,
          Class: TestWrapletDependency,
          required: false,
        },
      } as const satisfies WrapletDependencyMap;

      const core = new DefaultCore<HTMLDivElement, typeof map>(element, map);
      const wraplet = new TestWraplet(core);

      await wraplet.initialize();

      const dependency = wraplet.getDependency();
      if (!dependency) {
        throw new Error("Dependency not found.");
      }

      expect(initializerParent).toHaveBeenCalledTimes(1);
      expect(wraplet.wraplet.status.isInitialized).toBe(true);
      expect(dependency.wraplet.status.isInitialized).toBe(true);
      expect(initializerDependency).toHaveBeenCalledTimes(1);

      await wraplet.destroy();
      expect(destroyParent).toHaveBeenCalledTimes(1);
      expect(wraplet.wraplet.status.isDestroyed).toBe(true);
      expect(dependency.wraplet.status.isDestroyed).toBe(true);
    });
  });
});
