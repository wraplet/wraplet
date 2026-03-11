import "./setup";
import {
  createRichWrapletApi,
  DefaultArgCreator,
  DefaultCore,
  DefaultWrapletSet,
  Status,
  WrapletApi,
  WrapletDependencyMap,
} from "../src";
import {
  DependenciesAreAlreadyDestroyedError,
  DependenciesAreNotAvailableError,
  TooManyChildrenFoundError,
  MapError,
} from "../src";
import { Core } from "../src";
import { DestroyListener } from "../src/Core/types/DestroyListener";
import { Wraplet, WrapletSymbol } from "../src/Wraplet/types/Wraplet";
import { WrapletCreator } from "../src";

describe("Test DefaultCore", () => {
  class TestWrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;

    constructor(private core: Core) {
      this.wraplet = createRichWrapletApi({
        core: this.core,
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
      "Wraplet is not yet fully initialized. You can fetch partial dependencies with the 'instantiatedDependencies' property.",
    );
  });

  it("Test DefaultCore internal error children expected a wraplet set", async () => {
    const node = document.createElement("div");
    node.innerHTML = `
  <div data-something></div>
  <div data-something></div>
`;

    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateDependencies();
      await core.initializeDependencies();
      // For an unexplained reason "children" child turned out to be not an array.
      (core.dependencies as any)["children"] = {
        isDestroyed: () => false,
      };
      await core.syncDependencies();
    };

    await expect(func).rejects.toThrow(
      "Internal logic error. Expected a WrapletSet.",
    );
  });

  it("Test DefaultCore internal error single dependency expected a Wraplet", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div>";

    const map = {
      child: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateDependencies();
      await core.initializeDependencies();
      // Corrupt the single dependency to not be a Wraplet.
      (core as any).directDependencies["child"] = {
        isDestroyed: () => false,
      };
      await core.syncDependencies();
    };

    await expect(func).rejects.toThrow(
      "Internal logic error. Expected a Wraplet.",
    );
  });

  it("Test DefaultCore single dependency returns null when node changes", async () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div>";

    const map = {
      child: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateDependencies();
    await core.initializeDependencies();

    const firstChild = core.dependencies["child"];
    expect(firstChild).not.toBeNull();

    // Replace the child element with a new one so the existing wraplet wraps a different node.
    node.innerHTML = "<div data-something></div>";

    await core.syncDependencies();

    // The new dependency should be a different instance since the node changed.
    const secondChild = core.dependencies["child"];
    expect(secondChild).not.toBeNull();
    expect(secondChild).not.toBe(firstChild);
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
    const newChildrenItem = document.createElement("div");
    newChildrenItem.setAttribute("data-children", "");
    node.appendChild(newChildrenItem);
    core.syncDependencies();
    expect(func).toHaveBeenCalledTimes(3);

    const newChildItem = document.createElement("div");
    newChildrenItem.setAttribute("data-child", "");
    node.appendChild(newChildItem);

    core.syncDependencies();
    expect(func).toHaveBeenCalledTimes(4);
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

    await expect(func).rejects.toThrow(DependenciesAreAlreadyDestroyedError);
  });

  it("Test DefaultCore child disappeared from parent before being destroyed", async () => {
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

    const child = core.dependencies["child"];
    (core.dependencies as any)["child"] = null;

    const func1 = async () => {
      await child?.wraplet.destroy();
    };

    await expect(func1).rejects.toThrow(
      "Internal logic error. Destroyed dependency couldn't be removed because it already doesn't exist.",
    );

    // Re-sync children to fix an issue.
    core.syncDependencies();
    expect(core.dependencies["child"]).not.toBeNull();

    const childrenItems = core.dependencies["children"];
    const childrenItem = Array.from(childrenItems)[0];
    childrenItems.delete(childrenItem);

    const func2 = async () => {
      await childrenItem?.wraplet.destroy();
    };

    await expect(func2).rejects.toThrow(
      "Internal logic error. Destroyed dependency couldn't be removed because it already doesn't exist.",
    );
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

  it("Test DefaultCore multiple instances wrapping the same element error", async () => {
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

    const core: Core<Node, typeof map> = new DefaultCore(node, map);
    core.instantiateDependencies();
    await core.initializeDependencies();

    const childElement = node.querySelector(`[${attribute}]`) as Element;

    const secondWraplet = new TestWrapletClass(
      new DefaultCore(childElement, {}),
    );
    core.dependencies["children"].add(secondWraplet);

    const func = async () => {
      await core.syncDependencies();
    };

    await expect(func).rejects.toThrow(
      "Internal logic error. Multiple instances wrapping the same element found in the core.",
    );
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

  it("Test DefaultCore initOptions with empty listeners", async () => {
    const node = document.createElement("div");
    const core = new DefaultCore(
      node,
      {},
      {
        dependencyInstantiatedListeners: undefined,
        dependencyDestroyedListeners: undefined,
      },
    );
    core.instantiateDependencies();
    await core.initializeDependencies();
    await core.destroy();
    expect(core.status.isDestroyed).toBe(true);
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
    const depListInst = jest.fn();
    const depListInit = jest.fn();
    const depListDestroy = jest.fn();

    const depApiInit = jest.fn();
    const depApiDestroy = jest.fn();

    class TestWrapletChild1 implements Wraplet {
      [WrapletSymbol]: true = true;

      constructor(core: Core) {
        this.wraplet = createRichWrapletApi({
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
        this.wraplet = createRichWrapletApi({
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

    const runIntializeAndDestroyWithErrorInListener = async () => {
      const core = new DefaultCore(element, map);
      core.addDependencyInitializedListener(async () => {
        throw new Error("Test error in a listener");
      });
      core.addDependencyInitializedListener(async () => {
        depListInit();
      });

      core.addDependencyDestroyedListener(async () => {
        throw new Error("Test error in a listener");
      });
      core.addDependencyInitializedListener(async () => {
        depListDestroy();
      });
      core.instantiateDependencies();
      await core.initializeDependencies();
      await core.destroy();
    };

    await expect(
      runIntializeAndDestroyWithErrorInListener,
    ).resolves.not.toThrow();

    // depInit should run twice, regardless of the error in the first listener.
    // It's once per child.
    expect(depListInit).toHaveBeenCalledTimes(2);

    // depDestroy should run twice, regardless of the error in the first listener.
    // It's once per child.
    expect(depListDestroy).toHaveBeenCalledTimes(2);

    // Callbacks registered on API should run once because they are registered
    // only on a single child.
    expect(depApiInit).toHaveBeenCalledTimes(1);
    expect(depApiDestroy).toHaveBeenCalledTimes(1);
  });
});
