import "./setup";
import {
  createCoreDependentWrapletApi,
  DefaultArgCreator,
  DefaultCore,
  DefaultWrapletSet,
  Status,
  WrapletApi,
  WrapletDependencyMap,
} from "../src";
import {
  DependenciesAreNotAvailableError,
  TooManyChildrenFoundError,
  MapError,
} from "../src";
import { Core } from "../src";
import { DestroyListener } from "../src/Core/types/DestroyListener";
import { Wraplet, WrapletSymbol } from "../src/Wraplet/types/Wraplet";
import { WrapletCreator } from "../src";
import { StatusWritable } from "../src/Wraplet/types/Status";

describe("Test DefaultCore", () => {
  class TestWrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;

    constructor(private core: Core) {
      this.wraplet = createCoreDependentWrapletApi({
        core: core,
        wraplet: this,
      });
    }

    public wraplet: WrapletApi;
  }

  it("Test DefaultCore not allowing required children if provided node is not a ParentNode", () => {
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
      const childrenManager = new DefaultCore(node, map);
      childrenManager.instantiateDependencies();
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const childrenManager = new DefaultCore(node, {});
      childrenManager.instantiateDependencies();
    };

    expect(func2).not.toThrow(MapError);
  });

  it("Test DefaultCore allowing non-required children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const node = document.createTextNode("test");

    const core = new DefaultCore(node, map);
    expect(() => {
      core.instantiateDependencies();
    }).not.toThrow();
  });

  it("should throw ChildrenAreNotAvailableError when accessing children before they are instantiated", () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletDependencyMap;
    const core = new DefaultCore(node, map);

    expect(() => core.dependencies).toThrow(DependenciesAreNotAvailableError);
    expect(() => core.dependencies).toThrow(
      "Wraplet is not yet fully initialized.",
    );
  });

  it("Test DefaultCore child without selector", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateDependencies();
      await core.initializeDependencies();
    };

    await expect(func).resolves.not.toThrow();
    expect(core.dependencies["children"]).toBeNull();
  });

  it("Test DefaultCore too many elements found", async () => {
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

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateDependencies();
      await core.initializeDependencies();
    };

    await expect(func).rejects.toThrow(TooManyChildrenFoundError);
  });

  it("Test DefaultCore multiple without selector", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div><div data-something></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    expect(core.dependencies["children"]).toBeInstanceOf(DefaultWrapletSet);
  });

  it("Test DefaultCore destroy children listeners", async () => {
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

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

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

  it("Test DefaultCore instantiate children listeners", async () => {
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

    const core: Core<Node, typeof map> = new DefaultCore(node, map);
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

  it("uses ArgCreator to compute child constructor arguments", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    // Local wraplet class that records received args beyond core
    class ArgAwareWraplet implements Wraplet {
      [WrapletSymbol]: true = true;
      private status: Status = {
        isGettingInitialized: false,
        isGettingDestroyed: false,
        isInitialized: false,
        isDestroyed: false,
      };
      protected isGettingInitialized = false;
      protected isInitialized = false;
      protected isGettingDestroyed = false;
      protected isDestroyed = false;

      public received: unknown[];
      private destroyListeners: DestroyListener[] = [];

      constructor(
        private core: Core,
        ...rest: unknown[]
      ) {
        this.received = rest;
      }

      public wraplet: WrapletApi = {
        status: this.status,

        accessNode: (callback: (node: Node) => void) => {
          callback(this.core.node);
        },
        addDestroyListener: (callback: DestroyListener): void => {
          this.destroyListeners.push(callback);
        },
        destroy: async () => {
          for (const listener of this.destroyListeners) {
            await listener(this);
          }
          this.isDestroyed = true;
        },
        initialize: async () => {
          this.isInitialized = true;
        },
      };
    }

    // Arg creator mock that should be invoked by DefaultCore.defaultWrapletCreator
    const createdValue = { via: "ArgCreator" };
    const createArgMock = jest.fn().mockImplementation(() => createdValue);
    // Use DefaultArgCreator to tag with ArgCreatorSymbol
    const argCreator = DefaultArgCreator.create(createArgMock);

    const map = {
      child: {
        selector: "[data-child]",
        Class: ArgAwareWraplet,
        multiple: false,
        required: true,
        args: [argCreator, 42, "plain"],
      },
    } as const satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();

    // ArgCreator should be called once with proper WrapletCreatorArgs
    expect(createArgMock).toHaveBeenCalledTimes(1);
    const callArg = createArgMock.mock.calls[0][0];
    expect(callArg.Class).toBe(ArgAwareWraplet);
    expect(callArg.element).toBe(node.querySelector("[data-child]"));
    expect(callArg.args).toEqual([createdValue, 42, "plain"]);

    // The constructed wraplet should receive the processed value instead of the ArgCreator instance
    const child = core.dependencies.child;
    expect(child.received).toEqual([createdValue, 42, "plain"]);
  });

  it("Test DefaultCore cannot be destroyed twice", async () => {
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

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const func = async () => {
      await core.destroy();
      await core.destroy();
    };

    await expect(func).rejects.toThrow("Dependencies are already destroyed.");
  });

  it("Test DefaultCore user accessing non-existing children", async () => {
    const node = document.createElement("div");

    const map = {} as const satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (core.dependencies as any)["child"];
    };

    expect(func).toThrow("Dependency 'child' has not been found.");
  });
  it("Test DefaultCore user accessing dependencies with symbol key", async () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletDependencyMap;
    const core: Core<Node, typeof map> = new DefaultCore(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();
    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (core.dependencies as any)[Symbol("test")];
    };
    expect(func).toThrow("Symbol access is not supported for dependencies.");
  });
  it("Test DefaultCore user setting dependencies directly", async () => {
    const node = document.createElement("div");

    const map = {} satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const func = () => {
      (core.dependencies as any)["child"] = "test";
    };

    expect(func).toThrow(
      "Dependencies cannot be set directly. Use the 'setExistingInstance' or 'addExistingInstance' methods instead.",
    );
  });

  it("Test DefaultCore with selector callback", async () => {
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

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    expect(core.dependencies["children"].size).toBe(2);
  });

  it("Test DefaultCore status getter", () => {
    const node = document.createElement("div");
    const core = new DefaultCore(node, {});
    expect(core.status).toEqual({
      isDestroyed: false,
      isGettingDestroyed: false,
      isInitialized: false,
      isGettingInitialized: false,
    });
  });

  it("Test DefaultCore postponed destruction during initialization", async () => {
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

    const core = new DefaultCore(node, map);
    core.instantiateDependencies();

    const initPromise = core.initializeDependencies();
    const destroyPromise = core.destroy();

    await Promise.all([initPromise, destroyPromise]);

    expect(core.status.isInitialized).toBe(false);
    expect(core.status.isDestroyed).toBe(true);
  });

  it("Test DefaultCore destruction of uninitialized core", async () => {
    const node = document.createElement("div");
    const core = new DefaultCore(node, {});

    expect(core.status.isInitialized).toBe(false);
    await core.destroy();

    expect(core.status.isDestroyed).toBe(true);
    expect(core.status.isGettingDestroyed).toBe(false);
  });

  it("Test DefaultCore initOptions", async () => {
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
    const core: Core<Node, typeof map> = new DefaultCore(node, map, {
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

  it("Test DefaultCore invalid map error", () => {
    class SomeClass {}
    const node = document.createElement("div");
    const classInstance = new SomeClass() as any;
    const func = () => {
      new DefaultCore(node, classInstance);
    };
    expect(func).toThrow("The map provided to the Core is not a valid map.");
  });

  it("should throw error if the node provided to the Core is not a valid node", () => {
    const invalidNode = {} as any;
    const map = {} as const satisfies WrapletDependencyMap;

    expect(() => new DefaultCore(invalidNode, map)).toThrow(
      "The node provided to the Core is not a valid node.",
    );
  });

  it("Test DefaultCore custom wraplet creator", async () => {
    const attributeChildren = "data-test-wraplet-children";
    const attributeChild = "data-test-wraplet-child";

    const map = {
      children: {
        selector: `[${attributeChildren}]`,
        Class: TestWrapletClass,
        multiple: true,
        required: true,
      },
      child: {
        selector: `[${attributeChild}]`,
        Class: TestWrapletClass,
        multiple: false,
        required: true,
      },
    } as const satisfies WrapletDependencyMap;

    const element = document.createElement("div");

    const elementChildrenItem = document.createElement("div");
    elementChildrenItem.setAttribute(attributeChildren, "");
    element.appendChild(elementChildrenItem);

    const elementChildItem = document.createElement("div");
    elementChildItem.setAttribute(attributeChild, "");
    element.appendChild(elementChildItem);

    const core = new DefaultCore(element, map);

    const func = jest.fn();

    const creator: WrapletCreator<Node, WrapletDependencyMap> = (args) => {
      expect(["child", "children"]).toContain(args.id);
      func();
      const core = new DefaultCore(args.element, {}, args.initOptions);
      return new args.Class(core, ...args.args);
    };

    core.setWrapletCreator(creator);

    core.instantiateDependencies();
    await core.initializeDependencies();

    expect(core.dependencies.child).toBeInstanceOf(TestWrapletClass);
    expect(core.dependencies.children.size).toBe(1);

    expect(func).toHaveBeenCalledTimes(2);
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

      const core = new DefaultCore(element, map);

      const childCore = new DefaultCore(document.createElement("div"), {});
      const instance = new TestWrapletClass(childCore);

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

      const core = new DefaultCore(element, map);

      const childCore = new DefaultCore(document.createElement("div"), {});
      const instance1 = new TestWrapletClass(childCore);
      const instance2 = new TestWrapletClass(childCore);

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

      const core = new DefaultCore(element, map);

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

      const core = new DefaultCore(element, map);

      const childCore = new DefaultCore(document.createElement("div"), {});
      const instance1 = new TestWrapletClass(childCore);
      const instance2 = new TestWrapletClass(childCore);

      core.addExistingInstance("children", instance1);
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

      const core = new DefaultCore(element, map);

      const childCore = new DefaultCore(document.createElement("div"), {});
      const instance = new TestWrapletClass(childCore);

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

      const core = new DefaultCore(element, map);

      const childCore = new DefaultCore(document.createElement("div"), {});
      const instance = new TestWrapletClass(childCore);

      core.setExistingInstance("child", instance);

      expect(() => core.instantiateDependencies()).toThrow(MapError);
    });
  });

  describe("Test DefaultCore required dependencies without selector", () => {
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
      const core = new DefaultCore(element, map);

      const childElement = document.createElement("div");
      const childCore = new DefaultCore(childElement, {});

      const childInstance = new TestWrapletClass(childCore);
      const childrenInstance = new TestWrapletClass(childCore);

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
      const core = new DefaultCore(element, map);

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
      const core = new DefaultCore(element, map);

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
      [WrapletSymbol]: true = true;

      constructor(core: Core) {
        this.wraplet = createCoreDependentWrapletApi({
          core: core,
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

      public wraplet: WrapletApi;
    }

    class TestWrapletChild2 implements Wraplet {
      [WrapletSymbol]: true = true;

      constructor(core: Core) {
        this.wraplet = createCoreDependentWrapletApi({
          core: core,
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
      const core = new DefaultCore(element, map);
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
      const core = new DefaultCore(element, map);
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
      const core = new DefaultCore(element, map);
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

  it("Test DefaultCore throws when initializeDependencies is called twice", async () => {
    const node = document.createElement("div");
    const core = new DefaultCore(node, {});
    core.instantiateDependencies();
    await core.initializeDependencies();

    await expect(core.initializeDependencies()).rejects.toThrow(
      "Dependencies are already initialized.",
    );
  });

  it("Test DefaultCore throws when instantiateDependencies is called twice", () => {
    const node = document.createElement("div");
    const core = new DefaultCore(node, {});
    core.instantiateDependencies();

    expect(() => core.instantiateDependencies()).toThrow(
      "Dependencies are already instantiated.",
    );
  });

  it("Test DefaultCore skips already initialized wraplet during initializeDependencies", async () => {
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

    const core = new DefaultCore(node, map);
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

  it("Test DefaultCore findExistingWraplet reuses existing multiple wraplet", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const constructorFn = jest.fn();

    class ChildWraplet implements Wraplet {
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(core: Core) {
        this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
        constructorFn();
      }

      async onInit() {}
      async onDestroy() {}
    }

    const map = {
      child: {
        selector: "[data-child]",
        Class: ChildWraplet,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core = new DefaultCore(node, map);

    // First, add an existing instance for the same element
    const childElement = node.querySelector("[data-child]")!;
    const existingCore = new DefaultCore(childElement, {});
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
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(core: Core) {
          this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
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

      const core = new DefaultCore(node, map);

      // Add an existing instance for a different element (not matched by selector)
      const externalElement = document.createElement("div");
      const existingCore = new DefaultCore(externalElement, {});
      const existingWraplet = new ChildWraplet(existingCore);
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
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(core: Core) {
          this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
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
      const core = new DefaultCore(node, map);

      // Manually set up an existing wraplet for the same element via private access
      const existingCore = new DefaultCore(childElement, {});
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
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(core: Core) {
          this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
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

      const core = new DefaultCore(node, map);

      // Set up an existing wraplet for a DIFFERENT element
      const differentElement = document.createElement("span");
      const existingCore = new DefaultCore(differentElement, {});
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
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(core: Core) {
          this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
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
      const core = new DefaultCore(node, map);

      // Create two wraplets wrapping the same element
      const core1 = new DefaultCore(childElement, {});
      const wraplet1 = new ChildWraplet(core1);
      const core2 = new DefaultCore(childElement, {});
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

      const core = new DefaultCore(node, map);

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
        [WrapletSymbol]: true = true;
        public wraplet: WrapletApi;

        constructor(core: Core) {
          this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
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

      const core = new DefaultCore(node, map);

      // Set directDependencies to a non-WrapletSet value for a multiple dep
      const coreAny = core as any;
      const fakeCore = new DefaultCore(document.createElement("div"), {});
      coreAny.directDependencies["children"] = new ChildWraplet(fakeCore);

      expect(() =>
        coreAny.findExistingWraplet("children", document.createElement("div")),
      ).toThrow("Internal logic error. Expected a WrapletSet.");
    });
  });

  it("Test DefaultCore removeDependency skips nullification when wraplet is different", async () => {
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

    const core = new DefaultCore(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();

    const originalChild = core.dependencies["child"];
    expect(originalChild).not.toBeNull();

    // Replace the dependency with a different wraplet instance
    const differentElement = document.createElement("div");
    const differentCore = new DefaultCore(differentElement, {});
    const differentWraplet = new TestWrapletClass(differentCore);
    const coreAny = core as any;
    coreAny.directDependencies["child"] = differentWraplet;

    // Destroy the original child — removeDependency should NOT nullify
    // because directDependencies["child"] !== originalChild anymore
    await originalChild!.wraplet.destroy();

    // The dependency should still be the different wraplet (not nullified)
    expect(coreAny.directDependencies["child"]).toBe(differentWraplet);
  });

  it("Test DefaultCore instantiateDependencies skips assignment when already instantiated", () => {
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

    const core = new DefaultCore(node, map);
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

  it("Test DefaultCore instantiateWrapletItem reuses existing wraplet", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-child></div>";

    const constructorFn = jest.fn();

    class ChildWraplet implements Wraplet {
      [WrapletSymbol]: true = true;
      public wraplet: WrapletApi;

      constructor(core: Core) {
        this.wraplet = createCoreDependentWrapletApi({ core, wraplet: this });
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
    const core = new DefaultCore(node, map);

    // Set up existing wraplet
    const existingCore = new DefaultCore(childElement, {});
    const existingWraplet = new ChildWraplet(existingCore);
    const coreAny = core as any;
    coreAny.directDependencies["child"] = existingWraplet;

    const mapWrapper = coreAny.mapWrapper;

    // Call instantiateWrapletItem — it should find and reuse the existing wraplet
    const result = coreAny.instantiateWrapletItem(
      "child",
      mapWrapper.getStartingMap()["child"],
      mapWrapper,
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

      constructor(core: Core) {
        this.wraplet = createCoreDependentWrapletApi({
          core: core,
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
    const core = new DefaultCore(element, map);

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
});
