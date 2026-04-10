import "../setup";
import {
  AbstractDependentWraplet,
  AbstractWraplet,
  Core,
  WrapletDependencyMap,
} from "../../src";
import { BaseElementTestWraplet } from "../resources/BaseElementTestWraplet";
import { DependencyInstance } from "../../src/Wraplet/types/DependencyInstance";
import { DependencyManager } from "../../src/DependencyManager/types/DependencyManager";

import { isWrapletApi } from "../../src/Wraplet/types/WrapletApi";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletDependencySelectorAttribute = `${testWrapletSelectorAttribute}-dependency`;

class TestWrapletDependency extends AbstractDependentWraplet {}

const dependenciesMap = {
  dependency: {
    selector: `[${testWrapletDependencySelectorAttribute}]`,
    Class: TestWrapletDependency,
    multiple: false,
    required: false,
    injector: Core.createInjector({}),
  },
} satisfies WrapletDependencyMap;

class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {
  public hasNode(): boolean {
    return !!this.node;
  }
}

describe("AbstractDependentWraplet", () => {
  describe("Instantiation & Initialization", () => {
    it("should require a node for initialization", () => {
      class TestWraplet extends AbstractDependentWraplet {}
      const func = () => {
        new TestWraplet(undefined as any);
      };
      expect(func).toThrow(Error);
    });

    it("should prohibit direct AbstractDependentWraplet instantiation", () => {
      const func = () => {
        (AbstractDependentWraplet as any).createDependentWraplets(
          undefined,
          undefined,
        );
      };
      expect(func).toThrow("You cannot instantiate an abstract class.");
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

      class TestWraplet extends AbstractDependentWraplet {
        public static create(node: ParentNode): TestWraplet {
          const wraplets = this.createDependentWraplets(node, {}, attribute);
          expect(wraplets.length).toEqual(1);

          return wraplets[0];
        }
      }

      const element = document.createElement("div");
      element.setAttribute(attribute, "");
      const wraplet = TestWraplet.create(element);
      expect(wraplet).toBeInstanceOf(TestWraplet);
    });

    describe("createAndInitializeWraplets", () => {
      it("should create and initialize wraplets", async () => {
        const attribute = "data-test-create-and-initialize";

        class TestWraplet extends AbstractDependentWraplet {
          public static createAndInit(
            node: ParentNode,
          ): Promise<TestWraplet[]> {
            return this.createAndInitializeWraplets(node, {}, attribute);
          }
        }

        document.body.innerHTML = `<div ${attribute}></div><div ${attribute}></div>`;

        const wraplets = await TestWraplet.createAndInit(document.body);

        expect(wraplets.length).toEqual(2);
        for (const wraplet of wraplets) {
          expect(wraplet).toBeInstanceOf(TestWraplet);
          expect(wraplet.wraplet.status.isInitialized).toBe(true);
        }
      });

      it("should create and initialize wraplets with dependencies", async () => {
        const attribute = "data-test-caiw";
        const depAttribute = "data-test-caiw-dep";

        class TestDependency extends AbstractWraplet {}

        const map = {
          dep: {
            selector: `[${depAttribute}]`,
            Class: TestDependency,
            multiple: false,
            required: true,
          },
        } satisfies WrapletDependencyMap;

        class TestWraplet extends AbstractDependentWraplet<
          Element,
          typeof map
        > {
          public static async createAndInit(
            node: ParentNode,
          ): Promise<TestWraplet[]> {
            return this.createAndInitializeWraplets(node, map, attribute);
          }

          public getDep() {
            return this.d.dep;
          }
        }

        document.body.innerHTML = `<div ${attribute}><div ${depAttribute}></div></div>`;

        const wraplets = await TestWraplet.createAndInit(document.body);

        expect(wraplets.length).toEqual(1);
        const wraplet = wraplets[0];
        expect(wraplet.wraplet.status.isInitialized).toBe(true);
        expect(wraplet.getDep()).toBeTruthy();
        expect(wraplet.getDep().wraplet.status.isInitialized).toBe(true);
      });

      it("should return an empty array when no matching elements exist", async () => {
        const attribute = "data-test-no-match";

        class TestWraplet extends AbstractDependentWraplet {
          public static async createAndInit(
            node: ParentNode,
          ): Promise<TestWraplet[]> {
            return this.createAndInitializeWraplets(node, {}, attribute);
          }
        }

        document.body.innerHTML = `<div></div>`;

        const wraplets = await TestWraplet.createAndInit(document.body);
        expect(wraplets).toEqual([]);
      });

      it("should pass additional arguments via createAndInitializeWraplets", async () => {
        const attribute = "data-test-caiw-args";

        class TestWraplet extends AbstractDependentWraplet {
          public extraArg: string;
          constructor(core: DependencyManager, extraArg: string) {
            super(core);
            this.extraArg = extraArg;
          }

          public static async createAndInit(
            node: ParentNode,
          ): Promise<TestWraplet[]> {
            return this.createAndInitializeWraplets(node, {}, attribute, [
              "hello",
            ]);
          }
        }

        document.body.innerHTML = `<div ${attribute}></div>`;

        const wraplets = await TestWraplet.createAndInit(document.body);

        expect(wraplets.length).toEqual(1);
        expect(wraplets[0].extraArg).toEqual("hello");
        expect(wraplets[0].wraplet.status.isInitialized).toBe(true);
      });
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

      if (!isWrapletApi<Element>(wraplet.wraplet)) {
        throw new Error("Wraplet API is not a valid WrapletApi instance.");
      }

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

      const instantiatedFunc = jest.fn();

      class TestWrapletDependency1 extends AbstractWraplet {
        public testMethod1(): boolean {
          instantiatedFunc();
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
          if (id === "dependency1") {
            (dependency as TestWrapletDependency1).testMethod1();
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

      expect(instantiatedFunc).toHaveBeenCalledTimes(1);
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
          return this.d;
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
          node: Node,
          public arg1: string,
        ) {
          super(node);
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
          return this.d.dependency.arg1;
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

  describe("Lifecycle", () => {
    it("should handle destruction scheduled during initialization", async () => {
      class TestWraplet extends AbstractDependentWraplet {}

      const element = document.createElement("div");

      const core = new Core(element, {});
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

    it("should auto-detect overridden onInitialized callback", async () => {
      const onInitializedFn = jest.fn();

      class TestWraplet extends AbstractDependentWraplet {
        protected async onInitialize(): Promise<void> {
          onInitializedFn();
        }
      }

      const element = document.createElement("div");
      const core = new Core(element, {});
      const wraplet = new TestWraplet(core);

      await wraplet.wraplet.initialize();

      expect(onInitializedFn).toHaveBeenCalledTimes(1);
    });

    it("should not call onInitialized when not overridden", async () => {
      class TestWraplet extends AbstractDependentWraplet {}

      const element = document.createElement("div");
      const core = new Core(element, {});
      const wraplet = new TestWraplet(core);

      await expect(wraplet.wraplet.initialize()).resolves.not.toThrow();
    });

    it("should auto-detect overridden onDestroyed callback", async () => {
      const onDestroyedFn = jest.fn();

      class TestWraplet extends AbstractDependentWraplet {
        protected async onDestroy(): Promise<void> {
          onDestroyedFn();
        }
      }

      const element = document.createElement("div");
      const core = new Core(element, {});
      const wraplet = new TestWraplet(core);

      await wraplet.wraplet.initialize();
      await wraplet.wraplet.destroy();

      expect(onDestroyedFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Auto-detection of overridden dependency lifecycle methods", () => {
    it("should auto-detect overridden onDependency* callbacks", async () => {
      const attribute = "data-test-wraplet";
      const dependencyAttribute = `${attribute}-dep`;

      const onDependencyInstantiatedFn = jest.fn();
      const onDependencyInitializedFn = jest.fn();
      const onDependencyDestroyedFn = jest.fn();

      class TestWrapletDependency extends AbstractWraplet {}

      const map = {
        dep: {
          selector: `[${dependencyAttribute}]`,
          Class: TestWrapletDependency,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof map> {
        protected async onDependencyInitialized(
          dependency: DependencyInstance<typeof map, keyof typeof map>,
          id: keyof typeof map,
        ) {
          onDependencyInitializedFn(id);
        }

        protected onDependencyInstantiated(
          dependency: DependencyInstance<typeof map, keyof typeof map>,
          id: keyof typeof map,
        ) {
          onDependencyInstantiatedFn(id);
        }

        protected async onDependencyDestroyed(
          dependency: DependencyInstance<typeof map, keyof typeof map>,
          id: keyof typeof map,
        ) {
          onDependencyDestroyedFn(id);
        }
      }

      document.body.innerHTML = `
<div ${attribute}>
    <div ${dependencyAttribute}></div>
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
      await wraplet.wraplet.destroy();

      expect(onDependencyInstantiatedFn).toHaveBeenCalledTimes(1);
      expect(onDependencyInstantiatedFn).toHaveBeenCalledWith("dep");

      expect(onDependencyInitializedFn).toHaveBeenCalledTimes(1);
      expect(onDependencyInitializedFn).toHaveBeenCalledWith("dep");

      expect(onDependencyDestroyedFn).toHaveBeenCalledTimes(1);
      expect(onDependencyDestroyedFn).toHaveBeenCalledWith("dep");
    });

    it("should not register dependency listeners when methods are not overridden", async () => {
      const attribute = "data-test-wraplet";
      const dependencyAttribute = `${attribute}-dep`;
      class TestWrapletDependency extends AbstractWraplet {}

      const map = {
        dep: {
          selector: `[${dependencyAttribute}]`,
          Class: TestWrapletDependency,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      class TestWraplet extends BaseElementTestWraplet<typeof map> {}

      document.body.innerHTML = `
<div ${attribute}>
    <div ${dependencyAttribute}></div>
</div>
`;
      // If the default "onDependencyInstantiate" method has been registered this would throw an error.
      const wraplet = TestWraplet.create<typeof map, TestWraplet>(
        attribute,
        map,
        document,
      );

      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }

      await expect(wraplet.wraplet.initialize()).resolves.not.toThrow();
      await expect(wraplet.wraplet.destroy()).resolves.not.toThrow();
    });
  });

  it("handles method overrides when only parent overrides", async () => {
    const funcInit = jest.fn();
    const funcDestroy = jest.fn();
    const funcOnDependencyDestroyed = jest.fn();
    const funcOnDependencyInstantiated = jest.fn();
    const funcOnDependencyInitialized = jest.fn();
    class LevelOne extends AbstractDependentWraplet {
      protected async onInitialize() {
        funcInit();
      }

      protected async onDestroy() {
        funcDestroy();
      }

      protected async onDependencyDestroyed() {
        funcOnDependencyDestroyed();
      }

      protected async onDependencyInstantiated() {
        funcOnDependencyInstantiated();
      }

      protected async onDependencyInitialized() {
        funcOnDependencyInitialized();
      }
    }
    class LevelTwo extends LevelOne {}

    const core = new Core(document.createElement("div"), {});

    const wraplet = new LevelTwo(core);
    await wraplet.wraplet.initialize();
    await wraplet.wraplet.destroy();

    expect(funcInit).toHaveBeenCalledTimes(1);
    expect(funcDestroy).toHaveBeenCalledTimes(1);
    expect(funcOnDependencyDestroyed).not.toHaveBeenCalledTimes(1);
    expect(funcOnDependencyInstantiated).not.toHaveBeenCalledTimes(1);
    expect(funcOnDependencyInitialized).not.toHaveBeenCalledTimes(1);
  });

  it("throws when calling createWraplets on AbstractDependentWraplet", () => {
    class TestDependentWraplet extends AbstractDependentWraplet {
      public static create() {
        return this.createWraplets();
      }
    }
    expect(() => TestDependentWraplet.create()).toThrow(
      "This method is not supported for AbstractDependentWraplet.",
    );
  });
});
