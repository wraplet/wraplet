import "./setup";
import {
  Core,
  DefaultWrapletSet,
  WrapletDependencyMap,
  createWrapletApi,
  WrapletApi,
  NodelessWrapletApi,
  createNodelessWrapletApi,
} from "../src";
import {
  DependenciesAreNotAvailableError,
  TooManyChildrenFoundError,
  MapError,
} from "../src";
import { DependencyManager } from "../src";
import {
  NodelessWraplet,
  NodelessWrapletSymbol,
  Wraplet,
  WrapletSymbol,
} from "../src/Wraplet/types/Wraplet";
import { StatusWritable } from "../src/Wraplet/types/Status";
import { fillMapWithDefaults } from "../src/Map/utils";

describe("Test Core", () => {
  class TestWrapletClass implements Wraplet {
    [NodelessWrapletSymbol]: true = true;
    [WrapletSymbol]: true = true;
    public wraplet: WrapletApi;

    constructor(private node: Node) {
      this.wraplet = createWrapletApi({
        node: node,
        wraplet: this,
      });
    }
  }

  class TestWrapletClassWithDependencies implements Wraplet {
    [NodelessWrapletSymbol]: true = true;
    [WrapletSymbol]: true = true;
    public wraplet: WrapletApi;

    constructor(private dm: DependencyManager) {
      this.wraplet = createWrapletApi({
        node: dm.node,
        wraplet: this,
      });
    }
  }

  it("Test Core not allowing required children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: true,
      },
    } as const satisfies WrapletDependencyMap;

    const node = document.createTextNode("test");

    const func1 = () => {
      const childrenManager = new Core(node, map);
      childrenManager.instantiateDependencies();
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const childrenManager = new Core(node, {});
      childrenManager.instantiateDependencies();
    };

    expect(func2).not.toThrow(MapError);
  });

  it("Test Core allowing non-required children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const node = document.createTextNode("test");

    const core = new Core(node, map);
    expect(() => {
      core.instantiateDependencies();
    }).not.toThrow();
  });

  it("should throw ChildrenAreNotAvailableError when accessing children before they are instantiated", () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletDependencyMap;
    const core = new Core(node, map);

    expect(() => core.dependencies).toThrow(DependenciesAreNotAvailableError);
    expect(() => core.dependencies).toThrow(
      "Wraplet is not yet fully initialized.",
    );
  });

  it("Test Core child without selector", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    const func = async () => {
      core.instantiateDependencies();
      await core.initializeDependencies();
    };

    await expect(func).resolves.not.toThrow();
    expect(core.dependencies["children"]).toBeNull();
  });

  it("Test Core too many elements found", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div><div data-something></div>";

    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    const func = async () => {
      core.instantiateDependencies();
      await core.initializeDependencies();
    };

    await expect(func).rejects.toThrow(TooManyChildrenFoundError);
  });

  it("Test Core multiple without selector", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div><div data-something></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    expect(core.dependencies["children"]).toBeInstanceOf(DefaultWrapletSet);
  });

  it("Test Core destroy children listeners", async () => {
    const node = document.createElement("div");
    node.innerHTML =
      "<div data-children></div><div data-children><div data-child></div>";

    const map = {
      children: {
        selector: "[data-children]",
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    const func = jest.fn();
    core.addDependencyDestroyedListener(async () => {
      func();
    });

    core.instantiateDependencies();
    await core.initializeDependencies();

    for (const child of core.dependencies.children.values()) {
      await child.wraplet.destroy();
    }

    await core.dependencies.child?.wraplet.destroy();

    expect(func).toHaveBeenCalledTimes(3);
  });

  it("Test Core instantiate children listeners", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-children></div><div data-children></div>";

    const map = {
      children: {
        selector: "[data-children]",
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const func = jest.fn();

    const core: DependencyManager<Node, typeof map> = new Core(node, map);
    const funcInitialized = jest.fn();

    core.addDependencyInstantiatedListener(async () => {
      func();
    });

    core.addDependencyInitializedListener(async () => {
      funcInitialized();
    });

    core.instantiateDependencies();
    await core.initializeDependencies();
    expect(func).toHaveBeenCalledTimes(2);
    expect(funcInitialized).toHaveBeenCalledTimes(2);
  });

  it("Test Core cannot be destroyed twice", async () => {
    const node = document.createElement("div");
    node.innerHTML =
      "<div data-children></div><div data-children></div><div data-child></div>";

    const map = {
      children: {
        selector: "[data-children]",
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const func = async () => {
      await core.destroy();
      await core.destroy();
    };

    await expect(func).rejects.toThrow("Dependencies are already destroyed.");
  });

  it("Test Core user accessing non-existing children", async () => {
    const node = document.createElement("div");

    const map = {} as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (core.dependencies as any)["child"];
    };

    expect(func).toThrow("Dependency 'child' has not been found.");
  });
  it("Test Core user accessing dependencies with symbol key", async () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletDependencyMap;
    const core: DependencyManager<Node, typeof map> = new Core(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();
    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (core.dependencies as any)[Symbol("test")];
    };
    expect(func).toThrow("Symbol access is not supported for dependencies.");
  });
  it("Test Core user setting dependencies directly", async () => {
    const node = document.createElement("div");

    const map = {} satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const func = () => {
      (core.dependencies as any)["child"] = "test";
    };

    expect(func).toThrow(
      "Dependencies cannot be set directly. Use the 'setExistingInstance' or 'addExistingInstance' methods instead.",
    );
  });

  it("Test Core with selector callback", async () => {
    const attribute = "data-test-selector";
    const node = document.createElement("div");
    node.innerHTML = `<div ${attribute}></div><div ${attribute}></div>`;

    const map = {
      children: {
        selector: (node: ParentNode) => {
          return Array.from(node.querySelectorAll(`[${attribute}]`));
        },
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: DependencyManager<Node, typeof map> = new Core(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    expect(core.dependencies["children"].size).toBe(2);
  });

  it("Test Core status getter", () => {
    const node = document.createElement("div");
    const core = new Core(node, {});
    expect(core.status).toEqual({
      isDestroyed: false,
      isGettingDestroyed: false,
      isInitialized: false,
      isGettingInitialized: false,
    });
  });

  it("Test Core postponed destruction during initialization", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";
    const map = {
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core = new Core(node, map);
    core.instantiateDependencies();

    const initPromise = core.initializeDependencies();
    const destroyPromise = core.destroy();

    await Promise.all([initPromise, destroyPromise]);

    expect(core.status.isInitialized).toBe(false);
    expect(core.status.isDestroyed).toBe(true);
  });

  it("Test Core destruction of uninitialized core", async () => {
    const node = document.createElement("div");
    const core = new Core(node, {});

    expect(core.status.isInitialized).toBe(false);
    await core.destroy();

    expect(core.status.isDestroyed).toBe(true);
    expect(core.status.isGettingDestroyed).toBe(false);
  });

  it("Test Core initOptions", async () => {
    const attribute = "data-test-selector";
    const node = document.createElement("div");
    node.innerHTML = `<div ${attribute}></div>`;

    const map = {
      children: {
        selector: (node: ParentNode) => {
          return Array.from(node.querySelectorAll(`[${attribute}]`));
        },
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const funcInstantiate = jest.fn();
    const funcDestroy = jest.fn();
    const funcInitialized = jest.fn();
    const core: DependencyManager<Node, typeof map> = new Core(node, map, {
      dependencyInstantiatedListeners: [
        async (child) => {
          funcInstantiate();
          expect(child).toBeInstanceOf(TestWrapletClass);
        },
      ],
      dependencyInitializedListeners: [
        async (child) => {
          funcInitialized();
          expect(child).toBeInstanceOf(TestWrapletClass);
        },
      ],
      dependencyDestroyedListeners: [
        async (child) => {
          funcDestroy();
          expect(child).toBeInstanceOf(TestWrapletClass);
        },
      ],
    });
    core.instantiateDependencies();
    await core.initializeDependencies();

    await core.destroy();

    expect(funcInstantiate).toHaveBeenCalledTimes(1);
    expect(funcInitialized).toHaveBeenCalledTimes(1);
    expect(funcDestroy).toHaveBeenCalledTimes(1);
  });

  it("Test Core invalid map error", () => {
    class SomeClass {}
    const node = document.createElement("div");
    const classInstance = new SomeClass() as any;
    const func = () => {
      new Core(node, classInstance);
    };
    expect(func).toThrow("The map provided to the Core is not a valid map.");
  });

  it("should throw error if the node provided to the Core is not a valid node", () => {
    const invalidNode = {} as any;
    const map = {} as const satisfies WrapletDependencyMap;

    expect(() => new Core(invalidNode, map)).toThrow(
      "The node provided to the Core is not a valid node.",
    );
  });

  describe("Test setExistingInstance and addExistingInstance validations", () => {
    it("should throw when setExistingInstance is called on a multiple dependency", () => {
      const element = document.createElement("div");
      const map = {
        children: {
          Class: TestWrapletClass,
          multiple: true,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(element, map);

      const childCore = new Core(document.createElement("div"), {});
      const instance = new TestWrapletClassWithDependencies(childCore);

      expect(() =>
        // @ts-expect-error We test a runtime error when a wrong input has been provided
        // even if TS protested.
        core.setExistingInstance("children", instance),
      ).toThrow(MapError);
    });

    it("should throw when setExistingInstance is called twice for the same dependency", () => {
      const element = document.createElement("div");
      const map = {
        child: {
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(element, map);

      const instance1 = new TestWrapletClass(document.createElement("div"));
      const instance2 = new TestWrapletClass(document.createElement("div"));

      core.setExistingInstance("child", instance1);

      expect(() => core.setExistingInstance("child", instance2)).toThrow(
        MapError,
      );
    });

    it("should throw when setExistingInstance is called with a non-wraplet", () => {
      const element = document.createElement("div");
      const map = {
        child: {
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(element, map);

      expect(() => core.setExistingInstance("child", {} as any)).toThrow(
        MapError,
      );
    });

    it("should allow adding multiple instances with addExistingInstance", () => {
      const element = document.createElement("div");

      const map = {
        children: {
          Class: TestWrapletClass,
          multiple: true,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(element, map);

      const elementChild1 = document.createElement("div");
      const instance1 = new TestWrapletClass(elementChild1);
      core.addExistingInstance("children", instance1);

      const elementChild2 = document.createElement("div");
      const instance2 = new TestWrapletClass(elementChild2);
      core.addExistingInstance("children", instance2);

      core.instantiateDependencies();

      expect(core.dependencies.children.size).toBe(2);
    });

    it("should throw when addExistingInstance is called on a single dependency", () => {
      const element = document.createElement("div");
      const map = {
        child: {
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(element, map);

      const instance = new TestWrapletClass(document.createElement("div"));

      // @ts-expect-error We test runtime error when a wrong input has been provided, even if TS protested.
      expect(() => core.addExistingInstance("child", instance)).toThrow(
        MapError,
      );
    });

    it("should throw MapError when single dependency with selector has manually provided instance", () => {
      const element = document.createElement("div");
      element.innerHTML = `<div data-child></div>`;

      const map = {
        child: {
          selector: "[data-child]",
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(element, map);

      const instance = new TestWrapletClass(document.createElement("div"));

      core.setExistingInstance("child", instance);

      expect(() => core.instantiateDependencies()).toThrow(MapError);
    });
  });

  describe("Test Core required dependencies without selector", () => {
    const map = {
      child: {
        Class: TestWrapletClass,
        multiple: false,
        required: true,
      },
      children: {
        Class: TestWrapletClass,
        required: true,
        multiple: true,
      },
    } satisfies WrapletDependencyMap;

    it("has manually provided required dependencies", async () => {
      const element = document.createElement("div");
      const core = new Core(element, map);

      const childInstance = new TestWrapletClass(document.createElement("div"));
      const childrenInstance = new TestWrapletClass(
        document.createElement("div"),
      );

      core.setExistingInstance("child", childInstance);
      core.addExistingInstance("children", childrenInstance);

      core.instantiateDependencies();

      expect(core.dependencies.child).toBe(childInstance);
      expect(core.dependencies.children.size).toBe(1);
      expect(core.dependencies.children.values()).toContain(childrenInstance);
    });

    it("doesn't have manually provided required dependencies when single", async () => {
      const map = {
        child: {
          Class: TestWrapletClass,
          multiple: false,
          required: true,
        },
      } satisfies WrapletDependencyMap;

      const element = document.createElement("div");
      const core = new Core(element, map);

      const func = () => {
        core.instantiateDependencies();
      };

      expect(func).toThrow(
        'Dependency "child" cannot at the same be required, have no selector, and be not provided otherwise.',
      );
    });

    it("doesn't have manually provided required dependencies when multiple", async () => {
      const map = {
        children: {
          Class: TestWrapletClass,
          multiple: true,
          required: true,
        },
      } satisfies WrapletDependencyMap;

      const element = document.createElement("div");
      const core = new Core(element, map);

      const func = () => {
        core.instantiateDependencies();
      };

      expect(func).toThrow(
        'Dependency "children" cannot at the same be required, have no selector, and be not provided otherwise.',
      );
    });
  });

  it("handles exceptions in the lifecycle callbacks", async () => {
    const consoleDirSpy = jest.spyOn(console, "dir").mockImplementation();
    const depListInst = jest.fn();
    const depListInit = jest.fn();
    const depListDestroy = jest.fn();

    const depApiInit = jest.fn();
    const depApiDestroy = jest.fn();

    class TestWrapletChild1 implements Wraplet {
      [NodelessWrapletSymbol]: true = true;
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(node: Node) {
        this.wraplet = createWrapletApi({
          node,
          wraplet: this,
          initializeCallback: this.onInit.bind(this),
          destroyCallback: this.onDestroy.bind(this),
        });
      }

      private async onInit() {
        depApiInit();
      }

      private async onDestroy() {
        depApiDestroy();
      }
    }

    class TestWrapletChild2 implements Wraplet {
      [NodelessWrapletSymbol]: true = true;
      [WrapletSymbol]: true = true;

      constructor(node: Node) {
        this.wraplet = createWrapletApi({
          node,
          wraplet: this,
        });
      }

      public wraplet: WrapletApi;
    }

    const map = {
      child1: {
        selector: "[data-child1]",
        Class: TestWrapletChild1,
        multiple: false,
        required: true,
      },
      child2: {
        selector: "[data-child2]",
        Class: TestWrapletChild2,
        multiple: false,
        required: true,
      },
    } satisfies WrapletDependencyMap;

    document.body.innerHTML = `
<div data-wraplet>
  <div data-child1></div>
  <div data-child2></div>  
</div>
    `;

    const element = document.querySelector("[data-wraplet]");
    if (!element) throw new Error("Element not found");

    const runInstantiateWithErrorInListener = () => {
      const core = new Core(element, map);
      core.addDependencyInstantiatedListener(() => {
        throw new Error("Test error in a listener");
      });
      core.addDependencyInstantiatedListener(() => {
        depListInst();
      });

      core.instantiateDependencies();
    };

    // If there is an error during the instantiation phase,
    // it should be thrown.
    expect(runInstantiateWithErrorInListener).toThrow(
      "Test error in a listener",
    );

    // Instantiation is synchronous, so a single error should prevent
    // other listeners from running.
    expect(depListInst).toHaveBeenCalledTimes(0);

    const runIntializeWithErrorInListener = async () => {
      const core = new Core(element, map);
      core.addDependencyInitializedListener(async () => {
        throw new Error("Test error in a listener");
      });
      core.addDependencyInitializedListener(async () => {
        depListInit();
      });

      core.instantiateDependencies();
      await core.initializeDependencies();
    };
    await expect(runIntializeWithErrorInListener).rejects.toThrow();

    // Multiple errors result in a single printout.
    expect(consoleDirSpy).toHaveBeenCalledTimes(1);

    const runDestroyWithErrorInListener = async () => {
      const core = new Core(element, map);
      core.addDependencyDestroyedListener(async () => {
        throw new Error("Test error in a listener");
      });
      core.addDependencyDestroyedListener(async () => {
        depListDestroy();
      });
      core.instantiateDependencies();
      await core.initializeDependencies();
      await core.destroy();
    };

    await expect(runDestroyWithErrorInListener).rejects.toThrow();

    expect(depListDestroy).toHaveBeenCalledTimes(2);

    // Initialize callback depApiInitshould run twice because it's registered
    // on a single child, but we initialize it in two async functions.
    expect(depApiInit).toHaveBeenCalledTimes(2);

    expect(depApiDestroy).toHaveBeenCalledTimes(1);

    consoleDirSpy.mockRestore();
  });

  it("Test Core throws when initializeDependencies is called twice", async () => {
    const node = document.createElement("div");
    const core = new Core(node, {});
    core.instantiateDependencies();
    await core.initializeDependencies();

    await expect(core.initializeDependencies()).rejects.toThrow(
      "Dependencies are already initialized.",
    );
  });

  it("Test Core throws when instantiateDependencies is called twice", () => {
    const node = document.createElement("div");
    const core = new Core(node, {});
    core.instantiateDependencies();

    expect(() => core.instantiateDependencies()).toThrow(
      "Dependencies are already instantiated.",
    );
  });

  it("Test Core skips already initialized wraplet during initializeDependencies", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const map = {
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core = new Core(node, map);
    core.instantiateDependencies();

    // Fully initialize the child before core init
    const child = core.dependencies["child"];
    expect(child).not.toBeNull();
    if (child) {
      await child.wraplet.initialize();
      expect(child.wraplet.status.isInitialized).toBe(true);

      // Now core.initializeDependencies should skip this already-initialized child (line 137)
      await core.initializeDependencies();
      expect(core.status.isInitialized).toBe(true);
    }
  });

  it("Test Core findExistingWraplet reuses existing multiple wraplet", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const constructorFn = jest.fn();

    class ChildWraplet implements Wraplet {
      [NodelessWrapletSymbol]: true = true;
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(dm: DependencyManager) {
        this.wraplet = createWrapletApi({
          node: dm.node,
          wraplet: this,
          initializeCallback: dm.initializeDependencies,
          destroyCallback: dm.destroy,
        });
        constructorFn();
      }
    }

    const map = {
      child: {
        selector: "[data-child]",
        Class: ChildWraplet,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core = new Core(node, map);

    // First, add an existing instance for the same element
    const childElement = node.querySelector("[data-child]")!;
    const existingCore = new Core(childElement, {});
    const existingWraplet = new ChildWraplet(existingCore);
    core.addExistingInstance("child", existingWraplet as any);

    // Now instantiate — findExistingWraplet should find the existing one and reuse it
    core.instantiateDependencies();

    expect(core.dependencies["child"].size).toBe(1);
    // Constructor called once for the manual instance, not again during instantiation
    expect(constructorFn).toHaveBeenCalledTimes(1);
  });

  describe("findExistingWraplet", () => {
    it("findExistingWraplet returns null for non-matching multiple wraplet element", () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div><div data-child></div>";

      const constructorFn = jest.fn();

      class ChildWraplet implements Wraplet {
        [NodelessWrapletSymbol]: true = true;
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(node: Node) {
          this.wraplet = createWrapletApi({ node, wraplet: this });
          constructorFn();
        }
      }

      const map = {
        child: {
          selector: "[data-child]",
          Class: ChildWraplet,
          multiple: true,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(node, map);

      // Add an existing instance for a different element (not matched by selector)
      const externalElement = document.createElement("div");
      const existingWraplet = new ChildWraplet(externalElement);
      core.addExistingInstance("child", existingWraplet);

      // Instantiate — findExistingWraplet won't match the external element to any selector result,
      // so new wraplets will be created for the two [data-child] elements
      core.instantiateDependencies();

      expect(core.dependencies["child"].size).toBe(3);
      // 1 from addExistingInstance + 2 new from instantiation
      expect(constructorFn).toHaveBeenCalledTimes(3);
    });

    it("findExistingWraplet for single dependency reuses matching wraplet", () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div>";

      const constructorFn = jest.fn();

      class ChildWraplet implements Wraplet {
        [NodelessWrapletSymbol]: true = true;
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(dm: DependencyManager) {
          this.wraplet = createWrapletApi({
            node: dm.node,
            wraplet: this,
            initializeCallback: dm.initializeDependencies,
            destroyCallback: dm.destroy,
          });
          constructorFn();
        }
      }

      const map = {
        child: {
          selector: "[data-child]",
          Class: ChildWraplet,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const childElement = node.querySelector("[data-child]")!;
      const core = new Core(node, map);

      // Manually set up an existing wraplet for the same element via private access
      const existingCore = new Core(childElement, {});
      const existingWraplet = new ChildWraplet(existingCore);
      const coreAny = core as any;
      coreAny.directDependencies["child"] = existingWraplet;
      coreAny.dependenciesAreInstantiated = true;

      // Call findExistingWraplet via instantiateWrapletItem (private)
      const result = coreAny.findExistingWraplet("child", childElement);
      expect(result).toBe(existingWraplet);
    });

    it("findExistingWraplet for single dependency returns null for non-matching node", () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div>";

      class ChildWraplet implements Wraplet {
        [NodelessWrapletSymbol]: true = true;
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(dm: DependencyManager) {
          this.wraplet = createWrapletApi({
            node: dm.node,
            wraplet: this,
            initializeCallback: core.initializeDependencies,
            destroyCallback: core.destroy,
          });
        }
      }

      const map = {
        child: {
          selector: "[data-child]",
          Class: ChildWraplet,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(node, map);

      // Set up an existing wraplet for a DIFFERENT element
      const differentElement = document.createElement("span");
      const existingCore = new Core(differentElement, {});
      const existingWraplet = new ChildWraplet(existingCore);
      const coreAny = core as any;
      coreAny.directDependencies["child"] = existingWraplet;

      const result = coreAny.findExistingWraplet(
        "child",
        document.createElement("div"),
      );
      expect(result).toBeNull();
    });

    it("findExistingWraplet throws for multiple instances wrapping same element", () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div>";

      class ChildWraplet implements Wraplet {
        [NodelessWrapletSymbol]: true = true;
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(dm: DependencyManager) {
          this.wraplet = createWrapletApi({
            node: dm.node,
            wraplet: this,
            initializeCallback: dm.initializeDependencies,
            destroyCallback: dm.destroy,
          });
        }
      }

      const map = {
        child: {
          selector: "[data-child]",
          Class: ChildWraplet,
          multiple: true,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const childElement = node.querySelector("[data-child]")!;
      const core = new Core(node, map);

      // Create two wraplets wrapping the same element
      const core1 = new Core(childElement, {});
      const wraplet1 = new ChildWraplet(core1);
      const core2 = new Core(childElement, {});
      const wraplet2 = new ChildWraplet(core2);

      const set = new DefaultWrapletSet();
      set.add(wraplet1);
      set.add(wraplet2);

      const coreAny = core as any;
      coreAny.directDependencies["child"] = set;

      expect(() => coreAny.findExistingWraplet("child", childElement)).toThrow(
        "Internal logic error. Multiple instances wrapping the same element found in the core.",
      );
    });

    it("findExistingWraplet throws InternalLogicError for non-Wraplet single dependency", () => {
      const node = document.createElement("div");

      const map = {
        child: {
          selector: "[data-child]",
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } as const satisfies WrapletDependencyMap;

      const core = new Core(node, map);

      // Set directDependencies to a non-Wraplet value for a single dep
      const coreAny = core as any;
      coreAny.directDependencies["child"] = { notAWraplet: true };

      expect(() =>
        coreAny.findExistingWraplet("child", document.createElement("div")),
      ).toThrow("Internal logic error. Expected a Wraplet.");
    });

    it("findExistingWraplet throws InternalLogicError for non-WrapletSet multiple dependency", () => {
      const node = document.createElement("div");

      class ChildWraplet implements Wraplet {
        [NodelessWrapletSymbol]: true = true;
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(dm: DependencyManager) {
          this.wraplet = createWrapletApi({
            node: dm.node,
            wraplet: this,
            initializeCallback: dm.initializeDependencies,
            destroyCallback: dm.destroy,
          });
        }
      }

      const map = {
        children: {
          selector: "[data-child]",
          Class: ChildWraplet,
          multiple: true,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const core = new Core(node, map);

      // Set directDependencies to a non-WrapletSet value for a multiple dep
      const coreAny = core as any;
      const fakeCore = new Core(document.createElement("div"), {});
      coreAny.directDependencies["children"] = new ChildWraplet(fakeCore);

      expect(() =>
        coreAny.findExistingWraplet("children", document.createElement("div")),
      ).toThrow("Internal logic error. Expected a WrapletSet.");
    });
  });

  it("Test Core removeDependency skips nullification when wraplet is different", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const map = {
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    const core = new Core(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();

    const originalChild = core.dependencies["child"];
    expect(originalChild).not.toBeNull();

    // Replace the dependency with a different wraplet instance
    const differentElement = document.createElement("div");
    const differentWraplet = new TestWrapletClass(differentElement);
    const coreAny = core as any;
    coreAny.directDependencies["child"] = differentWraplet;

    // Destroy the original child — removeDependency should NOT nullify
    // because directDependencies["child"] !== originalChild anymore
    await originalChild!.wraplet.destroy();

    // The dependency should still be the different wraplet (not nullified)
    expect(coreAny.directDependencies["child"]).toBe(differentWraplet);
  });

  it("Test Core instantiateDependencies skips assignment when already instantiated", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const map = {
      child: {
        selector: "[data-child]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core = new Core(node, map);
    const coreAny = core as any;

    // First instantiate normally
    core.instantiateDependencies();
    const originalDeps = coreAny.directDependencies;

    // Now bypass the guard and call again with dependenciesAreInstantiated=true
    // to cover the else branch at line 230
    coreAny.dependenciesAreInstantiated = false;
    // Set it back to true right before the if check via a getter override
    const origInstantiateSingle =
      coreAny.instantiateSingleWrapletDependency.bind(coreAny);
    coreAny.instantiateSingleWrapletDependency = (
      ...args: Parameters<typeof origInstantiateSingle>
    ) => {
      coreAny.dependenciesAreInstantiated = true;
      return origInstantiateSingle(...args);
    };

    core.instantiateDependencies();

    // directDependencies should NOT have been reassigned (else branch)
    expect(coreAny.directDependencies).toBe(originalDeps);
  });

  it("instantiateWrapletItem reuses existing wraplet", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const constructorFn = jest.fn();

    class ChildWraplet implements Wraplet {
      [NodelessWrapletSymbol]: true = true;
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(dm: DependencyManager) {
        this.wraplet = createWrapletApi({
          node: dm.node,
          wraplet: this,
          initializeCallback: dm.initializeDependencies,
          destroyCallback: dm.destroy,
        });
        constructorFn();
      }
    }

    const map = {
      child: {
        selector: "[data-child]",
        Class: ChildWraplet,
        multiple: false,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    const childElement = node.querySelector("[data-child]")!;
    const core = new Core(node, map);

    // Set up existing wraplet
    const existingCore = new Core(childElement, {});
    const existingWraplet = new ChildWraplet(existingCore);
    const coreAny = core as any;
    coreAny.directDependencies["child"] = existingWraplet;

    // Call instantiateWrapletItem — it should find and reuse the existing wraplet
    const result = coreAny.instantiateWrapletItem(
      "child",
      fillMapWithDefaults(map)["child"],
      childElement,
    );
    expect(result).toBe(existingWraplet);
    // Constructor only called once (for the manual creation)
    expect(constructorFn).toHaveBeenCalledTimes(1);
  });

  it("skips dependencies that are already destroyed or getting destroyed", async () => {
    const fn = jest.fn();

    class WrapletClass implements Wraplet {
      [NodelessWrapletSymbol]: true = true;
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(node: Node) {
        this.wraplet = createWrapletApi({
          node,
          wraplet: this,
          destroyCallback: async () => {
            fn();
          },
        });
      }
    }

    const map = {
      dep1: {
        selector: "[data-dep1]",
        Class: WrapletClass,
        required: false,
        multiple: false,
      },
      dep2: {
        selector: "[data-dep2]",
        Class: WrapletClass,
        required: false,
        multiple: false,
      },
    } satisfies WrapletDependencyMap;

    const element = document.createElement("div");
    element.innerHTML = `<div data-dep1></div><div data-dep2></div>`;
    const core = new Core(element, map);

    core.instantiateDependencies();

    await core.initializeDependencies();

    if (!core.dependencies.dep1) {
      throw new Error("dep1 not found");
    }

    if (!core.dependencies.dep2) {
      throw new Error("dep2 not found");
    }

    const dep1 = core.dependencies.dep1;

    // We remove the wraplet's default destroy listener that removes it from
    // the core's dependencies to achieve an incorrect state, but the one
    // we want to test.
    (dep1.wraplet as any).__destroyListeners.length = 0;

    // Now we can destroy it.
    await dep1.wraplet.destroy();

    const dep2 = core.dependencies.dep2;

    // We fake the situation when the wraplet is still during the
    // destruction process. In reality, it has been NOT destroyed,
    // so the `fn` shouldn't run for it. But because it's marked
    // as `isGettingDestroyed` it will be skipped and not
    // destroyed by the core.
    (dep2.wraplet.status as StatusWritable).isGettingDestroyed = true;

    await core.destroy();

    // `fn` should run only once: for dep1.
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("allows for coreless leaf-dependencies", async () => {
    class CorelessWraplet implements Wraplet {
      [NodelessWrapletSymbol]: true = true;
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(private node: Node) {
        this.wraplet = createWrapletApi({
          node: node,
          wraplet: this,
        });
      }

      public getNode(): Node {
        return this.node;
      }
    }

    const map = {
      child: {
        selector: "[data-something]",
        Class: CorelessWraplet,
        multiple: false,
        required: true,
      },
    } satisfies WrapletDependencyMap;

    const node = document.createElement("div");
    const childNode = document.createElement("div");
    childNode.setAttribute("data-something", "");
    node.appendChild(childNode);

    const core = new Core(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();

    const child = core.dependencies.child;

    expect(child).toBeInstanceOf(CorelessWraplet);
    expect(child.getNode()).toBe(childNode);
  });

  it("throws on invalid map argument in createInjector", () => {
    const injector = Core.createInjector(
      "invalid" as unknown as WrapletDependencyMap,
    );

    const fakeMapTreeBuilder = {
      getParent: jest.fn(),
      setMap: jest.fn(),
    };

    expect(() =>
      injector.callback(
        document.createElement("div"),
        fakeMapTreeBuilder as any,
        {},
      ),
    ).toThrow("Invalid map argument.");
  });

  it("handles nodeless wraplets", async () => {
    class TestNodelessWraplet implements NodelessWraplet {
      [NodelessWrapletSymbol]: true = true;
      public wraplet: NodelessWrapletApi;

      constructor() {
        this.wraplet = createNodelessWrapletApi({
          wraplet: this,
        });
      }
    }

    const map = {
      dep: {
        Class: TestNodelessWraplet,
        required: true,
        multiple: false,
      },
    } satisfies WrapletDependencyMap;

    const core = new Core(document.createElement("div"), map);

    const instance = new TestNodelessWraplet();

    core.setExistingInstance("dep", instance);

    core.instantiateDependencies();

    await core.initializeDependencies();

    const child = core.dependencies.dep;

    expect(child).toBe(instance);
  });

  it("throws when dependency class does not produce a Wraplet instance", () => {
    class NotAWraplet {}

    const map = {
      broken: {
        selector: "[data-broken]",
        Class: NotAWraplet as any,
        multiple: false,
        required: true,
      },
    } satisfies WrapletDependencyMap;

    const node = document.createElement("div");
    const child = document.createElement("div");
    child.setAttribute("data-broken", "");
    node.appendChild(child);

    const core = new Core(node, map);

    expect(() => core.instantiateDependencies()).toThrow(
      "Created dependency is not a Wraplet instance.",
    );
  });
});
