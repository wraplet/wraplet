import "./setup";
import {
  DDM,
  DefaultWrapletSet,
  WrapletDependencyMap,
  createWrapletApi,
  WrapletApi,
} from "../src";
import {
  DependenciesAreNotAvailableError,
  TooManyChildrenFoundError,
  MapError,
} from "../src";
import { DependencyManager } from "../src/DependencyManager/types/DependencyManager";
import { Wraplet, WrapletSymbol } from "../src/Wraplet/types/Wraplet";
import { StatusWritable } from "../src/Wraplet/types/Status";
import { fillMapWithDefaults } from "../src/Map/utils";

describe("Test DDM", () => {
  class TestWrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    public wraplet: WrapletApi;

    constructor(private node: Node) {
      this.wraplet = createWrapletApi({
        node,
        wraplet: this,
      });
    }
  }

  class TestWrapletClassWithDependencies implements Wraplet {
    [WrapletSymbol]: true = true;
    public wraplet: WrapletApi;

    constructor(private dm: DependencyManager) {
      this.wraplet = createWrapletApi({
        node: dm.node,
        wraplet: this,
      });
    }
  }

  it("Test DDM not allowing required children if provided node is not a ParentNode", () => {
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
      const childrenManager = new DDM(node, map);
      childrenManager.instantiateDependencies();
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const childrenManager = new DDM(node, {});
      childrenManager.instantiateDependencies();
    };

    expect(func2).not.toThrow(MapError);
  });

  it("Test DDM allowing non-required children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const node = document.createTextNode("test");

    const ddm = new DDM(node, map);
    expect(() => {
      ddm.instantiateDependencies();
    }).not.toThrow();
  });

  it("should throw ChildrenAreNotAvailableError when accessing children before they are instantiated", () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletDependencyMap;
    const ddm = new DDM(node, map);

    expect(() => ddm.dependencies).toThrow(DependenciesAreNotAvailableError);
    expect(() => ddm.dependencies).toThrow(
      "Wraplet is not yet fully initialized.",
    );
  });

  it("Test DDM child without selector", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    const func = async () => {
      ddm.instantiateDependencies();
      await ddm.initializeDependencies();
    };

    await expect(func).resolves.not.toThrow();
    expect(ddm.dependencies["children"]).toBeNull();
  });

  it("Test DDM too many elements found", async () => {
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

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    const func = async () => {
      ddm.instantiateDependencies();
      await ddm.initializeDependencies();
    };

    await expect(func).rejects.toThrow(TooManyChildrenFoundError);
  });

  it("Test DDM multiple without selector", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div><div data-something></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    expect(ddm.dependencies["children"]).toBeInstanceOf(DefaultWrapletSet);
  });

  it("Test DDM destroy children listeners", async () => {
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

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    const func = jest.fn();
    ddm.addDependencyDestroyedListener(async () => {
      func();
    });

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    for (const child of ddm.dependencies.children.values()) {
      await child.wraplet.destroy();
    }

    await ddm.dependencies.child?.wraplet.destroy();

    expect(func).toHaveBeenCalledTimes(3);
  });

  it("Test DDM instantiate children listeners", async () => {
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

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);
    const funcInitialized = jest.fn();

    ddm.addDependencyInstantiatedListener(async () => {
      func();
    });

    ddm.addDependencyInitializedListener(async () => {
      funcInitialized();
    });

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();
    expect(func).toHaveBeenCalledTimes(2);
    expect(funcInitialized).toHaveBeenCalledTimes(2);
  });

  it("Test DDM cannot be destroyed twice", async () => {
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

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    const func = async () => {
      await ddm.destroyDependencies();
      await ddm.destroyDependencies();
    };

    await expect(func).rejects.toThrow("Dependencies are already destroyed.");
  });

  it("Test DDM user accessing non-existing children", async () => {
    const node = document.createElement("div");

    const map = {} as const satisfies WrapletDependencyMap;

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (ddm.dependencies as any)["child"];
    };

    expect(func).toThrow("Dependency 'child' has not been found.");
  });
  it("Test DDM user accessing dependencies with symbol key", async () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletDependencyMap;
    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);
    ddm.instantiateDependencies();
    await ddm.initializeDependencies();
    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (ddm.dependencies as any)[Symbol("test")];
    };
    expect(func).toThrow("Symbol access is not supported for dependencies.");
  });
  it("Test DDM user setting dependencies directly", async () => {
    const node = document.createElement("div");

    const map = {} satisfies WrapletDependencyMap;

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    const func = () => {
      (ddm.dependencies as any)["child"] = "test";
    };

    expect(func).toThrow(
      "Dependencies cannot be set directly. Use the 'setExistingInstance' or 'addExistingInstance' methods instead.",
    );
  });

  it("Test DDM with selector callback", async () => {
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

    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map);

    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    expect(ddm.dependencies["children"].size).toBe(2);
  });

  it("Test DDM status getter", () => {
    const node = document.createElement("div");
    const ddm = new DDM(node, {});
    expect(ddm.status).toEqual({
      isDestroyed: false,
      isGettingDestroyed: false,
      isInitialized: false,
      isGettingInitialized: false,
    });
  });

  it("Test DDM postponed destruction during initialization", async () => {
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

    const ddm = new DDM(node, map);
    ddm.instantiateDependencies();

    const initPromise = ddm.initializeDependencies();
    const destroyPromise = ddm.destroyDependencies();

    await Promise.all([initPromise, destroyPromise]);

    expect(ddm.status.isInitialized).toBe(false);
    expect(ddm.status.isDestroyed).toBe(true);
  });

  it("Test DDM destruction of uninitialized DDM", async () => {
    const node = document.createElement("div");
    const ddm = new DDM(node, {});

    expect(ddm.status.isInitialized).toBe(false);
    await ddm.destroyDependencies();

    expect(ddm.status.isDestroyed).toBe(true);
    expect(ddm.status.isGettingDestroyed).toBe(false);
  });

  it("Test DDM initOptions", async () => {
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
    const ddm: DependencyManager<Node, typeof map> = new DDM(node, map, {
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
    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    await ddm.destroyDependencies();

    expect(funcInstantiate).toHaveBeenCalledTimes(1);
    expect(funcInitialized).toHaveBeenCalledTimes(1);
    expect(funcDestroy).toHaveBeenCalledTimes(1);
  });

  it("Test DDM invalid map error", () => {
    class SomeClass {}
    const node = document.createElement("div");
    const classInstance = new SomeClass() as any;
    const func = () => {
      new DDM(node, classInstance);
    };
    expect(func).toThrow("The map provided to the DDM is not a valid map.");
  });

  it("should throw error if the node provided to the DDM is not a valid node", () => {
    const invalidNode = {} as any;
    const map = {} as const satisfies WrapletDependencyMap;

    expect(() => new DDM(invalidNode, map)).toThrow(
      "The node provided to the DDM is not a valid node.",
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

      const ddm = new DDM(element, map);

      const childDDM = new DDM(document.createElement("div"), {});
      const instance = new TestWrapletClassWithDependencies(childDDM);

      expect(() =>
        // @ts-expect-error We test a runtime error when a wrong input has been provided
        // even if TS protested.
        ddm.setExistingInstance("children", instance),
      ).toThrow(MapError);
    });

    it("should not throw when setExistingInstance is called twice for the same dependency", () => {
      const element = document.createElement("div");
      const map = {
        child: {
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const ddm = new DDM(element, map);

      const instance1 = new TestWrapletClass(document.createElement("div"));
      const instance2 = new TestWrapletClass(document.createElement("div"));

      ddm.setExistingInstance("child", instance1);

      expect(() => ddm.setExistingInstance("child", instance2)).not.toThrow(
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

      const ddm = new DDM(element, map);

      expect(() => ddm.setExistingInstance("child", {} as any)).toThrow(
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

      const ddm = new DDM(element, map);

      const elementChild1 = document.createElement("div");
      const instance1 = new TestWrapletClass(elementChild1);
      ddm.addExistingInstance("children", instance1);

      const elementChild2 = document.createElement("div");
      const instance2 = new TestWrapletClass(elementChild2);
      ddm.addExistingInstance("children", instance2);

      ddm.instantiateDependencies();

      expect(ddm.dependencies.children.size).toBe(2);
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

      const ddm = new DDM(element, map);

      const instance = new TestWrapletClass(document.createElement("div"));

      // @ts-expect-error We test runtime error when a wrong input has been provided, even if TS protested.
      expect(() => ddm.addExistingInstance("child", instance)).toThrow(
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

      const ddm = new DDM(element, map);

      const instance = new TestWrapletClass(document.createElement("div"));

      ddm.setExistingInstance("child", instance);

      expect(() => ddm.instantiateDependencies()).toThrow(MapError);
    });
  });

  describe("Test DDM required dependencies without selector", () => {
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
      const ddm = new DDM(element, map);

      const childInstance = new TestWrapletClass(document.createElement("div"));
      const childrenInstance = new TestWrapletClass(
        document.createElement("div"),
      );

      ddm.setExistingInstance("child", childInstance);
      ddm.addExistingInstance("children", childrenInstance);

      ddm.instantiateDependencies();

      expect(ddm.dependencies.child).toBe(childInstance);
      expect(ddm.dependencies.children.size).toBe(1);
      expect(ddm.dependencies.children.values()).toContain(childrenInstance);
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
      const ddm = new DDM(element, map);

      const func = () => {
        ddm.instantiateDependencies();
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
      const ddm = new DDM(element, map);

      const func = () => {
        ddm.instantiateDependencies();
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
      const ddm = new DDM(element, map);
      ddm.addDependencyInstantiatedListener(() => {
        throw new Error("Test error in a listener");
      });
      ddm.addDependencyInstantiatedListener(() => {
        depListInst();
      });

      ddm.instantiateDependencies();
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
      const ddm = new DDM(element, map);
      ddm.addDependencyInitializedListener(async () => {
        throw new Error("Test error in a listener");
      });
      ddm.addDependencyInitializedListener(async () => {
        depListInit();
      });

      ddm.instantiateDependencies();
      await ddm.initializeDependencies();
    };
    await expect(runIntializeWithErrorInListener).rejects.toThrow();

    // Multiple errors result in a single printout.
    expect(consoleDirSpy).toHaveBeenCalledTimes(1);

    const runDestroyWithErrorInListener = async () => {
      const ddm = new DDM(element, map);
      ddm.addDependencyDestroyedListener(async () => {
        throw new Error("Test error in a listener");
      });
      ddm.addDependencyDestroyedListener(async () => {
        depListDestroy();
      });
      ddm.instantiateDependencies();
      await ddm.initializeDependencies();
      await ddm.destroyDependencies();
    };

    await expect(runDestroyWithErrorInListener).rejects.toThrow();

    expect(depListDestroy).toHaveBeenCalledTimes(2);

    // Initialize callback depApiInitshould run twice because it's registered
    // on a single child, but we initialize it in two async functions.
    expect(depApiInit).toHaveBeenCalledTimes(2);

    expect(depApiDestroy).toHaveBeenCalledTimes(1);

    consoleDirSpy.mockRestore();
  });

  it("Test DDM throws when initializeDependencies is called twice", async () => {
    const node = document.createElement("div");
    const ddm = new DDM(node, {});
    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    await expect(ddm.initializeDependencies()).rejects.toThrow(
      "Dependencies are already initialized.",
    );
  });

  it("Test DDM throws when instantiateDependencies is called twice", () => {
    const node = document.createElement("div");
    const ddm = new DDM(node, {});
    ddm.instantiateDependencies();

    expect(() => ddm.instantiateDependencies()).toThrow(
      "Dependencies are already instantiated.",
    );
  });

  it("Test DDM skips already initialized wraplet during initializeDependencies", async () => {
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

    const ddm = new DDM(node, map);
    ddm.instantiateDependencies();

    // Fully initialize the child before ddm init
    const child = ddm.dependencies["child"];
    expect(child).not.toBeNull();
    if (child) {
      await child.wraplet.initialize();
      expect(child.wraplet.status.isInitialized).toBe(true);

      // Now ddm.initializeDependencies should skip this already-initialized child (line 137)
      await ddm.initializeDependencies();
      expect(ddm.status.isInitialized).toBe(true);
    }
  });

  it("Test DDM findExistingWraplet reuses existing multiple wraplet", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const constructorFn = jest.fn();

    class ChildWraplet implements Wraplet {
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(node: Node) {
        this.wraplet = createWrapletApi({
          node,
          wraplet: this,
        });
        constructorFn();
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

    const ddm = new DDM(node, map);

    // First, add an existing instance for the same element
    const childElement = node.querySelector("[data-child]")!;
    const existingWraplet = new ChildWraplet(childElement);
    await existingWraplet.wraplet.initialize();

    ddm.addExistingInstance("children", existingWraplet);

    // Now instantiate — findExistingWraplet should find the existing one and reuse it
    ddm.instantiateDependencies();

    await ddm.initializeDependencies();

    expect(ddm.dependencies["children"].size).toBe(1);
    // Constructor called once for the manual instance, not again during instantiation
    expect(constructorFn).toHaveBeenCalledTimes(1);
  });

  describe("findExistingWraplet", () => {
    it("findExistingWraplet returns null for non-matching multiple wraplet element", () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div><div data-child></div>";

      const constructorFn = jest.fn();

      class ChildWraplet implements Wraplet {
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

      const ddm = new DDM(node, map);

      // Add an existing instance for a different element (not matched by selector)
      const externalElement = document.createElement("div");
      const existingWraplet = new ChildWraplet(externalElement);
      ddm.addExistingInstance("child", existingWraplet);

      // Instantiate — findExistingWraplet won't match the external element to any selector result,
      // so new wraplets will be created for the two [data-child] elements
      ddm.instantiateDependencies();

      expect(ddm.dependencies["child"].size).toBe(3);
      // 1 from addExistingInstance + 2 new from instantiation
      expect(constructorFn).toHaveBeenCalledTimes(3);
    });

    it("findExistingWraplet for single dependency reuses matching wraplet", async () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div>";

      const constructorFn = jest.fn();

      class ChildWraplet implements Wraplet {
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(node: Node) {
          this.wraplet = createWrapletApi({
            node,
            wraplet: this,
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
      const ddm = new DDM(node, map);

      // Manually set up an existing wraplet for the same element via private access
      const existingWraplet = new ChildWraplet(childElement);
      await existingWraplet.wraplet.initialize();

      const ddmAny = ddm as any;
      ddmAny.directDependencies["child"] = existingWraplet;
      ddmAny.dependenciesAreInstantiated = true;

      // Call findExistingWraplet via instantiateWrapletItem (private)
      const result = ddmAny.findExistingWraplet("child", childElement);
      expect(result).toBe(existingWraplet);
    });

    it("findExistingWraplet for single dependency returns null for non-matching node", () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div>";

      class ChildWraplet implements Wraplet {
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(dm: DependencyManager) {
          this.wraplet = createWrapletApi({
            node: dm.node,
            wraplet: this,
            initializeCallback: ddm.initializeDependencies,
            destroyCallback: ddm.destroyDependencies,
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

      const ddm = new DDM(node, map);

      // Set up an existing wraplet for a DIFFERENT element
      const differentElement = document.createElement("span");
      const existingDDM = new DDM(differentElement, {});
      const existingWraplet = new ChildWraplet(existingDDM);
      const ddmAny = ddm as any;
      ddmAny.directDependencies["child"] = existingWraplet;

      const result = ddmAny.findExistingWraplet(
        "child",
        document.createElement("div"),
      );
      expect(result).toBeNull();
    });

    it("findExistingWraplet throws for multiple instances wrapping same element", async () => {
      const node = document.createElement("div");
      node.innerHTML = "<div data-child></div>";

      class ChildWraplet implements Wraplet {
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(node: Node) {
          this.wraplet = createWrapletApi({
            node,
            wraplet: this,
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
      const ddm = new DDM(node, map);

      // Create two wraplets wrapping the same element
      const wraplet1 = new ChildWraplet(childElement);
      await wraplet1.wraplet.initialize();

      const wraplet2 = new ChildWraplet(childElement);
      await wraplet2.wraplet.initialize();

      const set = new DefaultWrapletSet();
      set.add(wraplet1);
      set.add(wraplet2);

      const ddmAny = ddm as any;
      ddmAny.directDependencies["child"] = set;

      expect(() => ddmAny.findExistingWraplet("child", childElement)).toThrow(
        "Internal logic error. Multiple instances wrapping the same element found in the DDM.",
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

      const ddm = new DDM(node, map);

      // Set directDependencies to a non-Wraplet value for a single dep
      const ddmAny = ddm as any;
      ddmAny.directDependencies["child"] = { notAWraplet: true };

      expect(() =>
        ddmAny.findExistingWraplet("child", document.createElement("div")),
      ).toThrow("Internal logic error. Expected a Wraplet.");
    });

    it("findExistingWraplet throws InternalLogicError for non-WrapletSet multiple dependency", () => {
      const node = document.createElement("div");

      class ChildWraplet implements Wraplet {
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(dm: DependencyManager) {
          this.wraplet = createWrapletApi({
            node: dm.node,
            wraplet: this,
            initializeCallback: dm.initializeDependencies,
            destroyCallback: dm.destroyDependencies,
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

      const ddm = new DDM(node, map);

      // Set directDependencies to a non-WrapletSet value for a multiple dep
      const ddmAny = ddm as any;
      const fakeDDM = new DDM(document.createElement("div"), {});
      ddmAny.directDependencies["children"] = new ChildWraplet(fakeDDM);

      expect(() =>
        ddmAny.findExistingWraplet("children", document.createElement("div")),
      ).toThrow("Internal logic error. Expected a WrapletSet.");
    });

    it("findExistingWraplet returns null when child element has wraplets but not the existing dependency", () => {
      const node = document.createElement("div");

      const map = {
        child: {
          selector: "[data-child]",
          Class: TestWrapletClass,
          multiple: false,
          required: false,
        },
      } satisfies WrapletDependencyMap;

      const ddm = new DDM(node, map);
      const ddmAny = ddm as any;

      // Create the existing dependency wraplet
      ddmAny.directDependencies["child"] = new TestWrapletClass(
        document.createElement("div"),
      );

      // Create a child element that has a wraplets set with a different wraplet
      const childElement = document.createElement("div");
      const otherWraplet = new TestWrapletClass(document.createElement("span"));
      childElement.wraplets = new DefaultWrapletSet();
      childElement.wraplets.add(otherWraplet);

      const result = ddmAny.findExistingWraplet("child", childElement);
      expect(result).toBeNull();
    });
  });

  it("Test DDM removeDependency skips nullification when wraplet is different", async () => {
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

    const ddm = new DDM(node, map);
    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    const originalChild = ddm.dependencies["child"];
    expect(originalChild).not.toBeNull();

    // Replace the dependency with a different wraplet instance
    const differentElement = document.createElement("div");
    const differentWraplet = new TestWrapletClass(differentElement);
    const ddmAny = ddm as any;
    ddmAny.directDependencies["child"] = differentWraplet;

    // Destroy the original child — removeDependency should NOT nullify
    // because directDependencies["child"] !== originalChild anymore
    await originalChild!.wraplet.destroy();

    // The dependency should still be the different wraplet (not nullified)
    expect(ddmAny.directDependencies["child"]).toBe(differentWraplet);
  });

  it("Test DDM instantiateDependencies skips assignment when already instantiated", () => {
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

    const ddm = new DDM(node, map);
    const ddmAny = ddm as any;

    // First instantiate normally
    ddm.instantiateDependencies();
    const originalDeps = ddmAny.directDependencies;

    // Now bypass the guard and call again with dependenciesAreInstantiated=true
    // to cover the else branch at line 230
    ddmAny.dependenciesAreInstantiated = false;
    // Set it back to true right before the if check via a getter override
    const origInstantiateSingle =
      ddmAny.instantiateSingleWrapletDependency.bind(ddmAny);
    ddmAny.instantiateSingleWrapletDependency = (
      ...args: Parameters<typeof origInstantiateSingle>
    ) => {
      ddmAny.dependenciesAreInstantiated = true;
      return origInstantiateSingle(...args);
    };

    ddm.instantiateDependencies();

    // directDependencies should NOT have been reassigned (else branch)
    expect(ddmAny.directDependencies).toBe(originalDeps);
  });

  it("instantiateWrapletItem reuses existing wraplet", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const constructorFn = jest.fn();

    class ChildWraplet implements Wraplet {
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(node: Node) {
        this.wraplet = createWrapletApi({
          node,
          wraplet: this,
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
    const ddm = new DDM(node, map);

    // Set up existing wraplet
    const existingWraplet = new ChildWraplet(childElement);
    await existingWraplet.wraplet.initialize();
    const ddmAny = ddm as any;
    ddmAny.directDependencies["child"] = existingWraplet;

    // Call instantiateWrapletItem — it should find and reuse the existing wraplet
    const result = ddmAny.instantiateWrapletItem(
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
    const ddm = new DDM(element, map);

    ddm.instantiateDependencies();

    await ddm.initializeDependencies();

    if (!ddm.dependencies.dep1) {
      throw new Error("dep1 not found");
    }

    if (!ddm.dependencies.dep2) {
      throw new Error("dep2 not found");
    }

    const dep1 = ddm.dependencies.dep1;

    // We remove the wraplet's default destroy listener that removes it from
    // the ddm's dependencies to achieve an incorrect state, but the one
    // we want to test.
    (dep1.wraplet as any).__destroyListeners.length = 0;

    // Now we can destroy it.
    await dep1.wraplet.destroy();

    const dep2 = ddm.dependencies.dep2;

    // We fake the situation when the wraplet is still during the
    // destruction process. In reality, it has been NOT destroyed,
    // so the `fn` shouldn't run for it. But because it's marked
    // as `isGettingDestroyed` it will be skipped and not
    // destroyed by the ddm.
    (dep2.wraplet.status as StatusWritable).isGettingDestroyed = true;

    await ddm.destroyDependencies();

    // `fn` should run only once: for dep1.
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("allows for non-dependent leaf-dependencies", async () => {
    class DDMlessWraplet implements Wraplet {
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
        Class: DDMlessWraplet,
        multiple: false,
        required: true,
      },
    } satisfies WrapletDependencyMap;

    const node = document.createElement("div");
    const childNode = document.createElement("div");
    childNode.setAttribute("data-something", "");
    node.appendChild(childNode);

    const ddm = new DDM(node, map);
    ddm.instantiateDependencies();
    await ddm.initializeDependencies();

    const child = ddm.dependencies.child;

    expect(child).toBeInstanceOf(DDMlessWraplet);
    expect(child.getNode()).toBe(childNode);
  });

  it("throws on invalid map argument in createInjector", () => {
    const injector = DDM.createInjector(
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

  it("handles dependencies that are not wraplets", async () => {
    class TestDependency implements Wraplet {
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor() {
        this.wraplet = createWrapletApi({
          wraplet: this,
        });
      }
    }

    const map = {
      dep: {
        Class: TestDependency,
        required: true,
        multiple: false,
      },
    } satisfies WrapletDependencyMap;

    const ddm = new DDM(document.createElement("div"), map);

    const instance = new TestDependency();

    ddm.setExistingInstance("dep", instance);

    ddm.instantiateDependencies();

    await ddm.initializeDependencies();

    const child = ddm.dependencies.dep;

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

    const ddm = new DDM(node, map);

    expect(() => ddm.instantiateDependencies()).toThrow(
      "Created dependency is not a Wraplet instance.",
    );
  });
});
