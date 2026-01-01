import "./setup";
import {
  DefaultArgCreator,
  DefaultCore,
  DefaultWrapletSet,
  Status,
  WrapletApi,
  WrapletChildrenMap,
} from "../src";
import {
  ChildrenAreAlreadyDestroyedError,
  ChildrenAreNotAvailableError,
  ChildrenTooManyFoundError,
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
    private status: StatusWritable = {
      isGettingInitialized: false,
      isGettingDestroyed: false,
      isInitialized: false,
      isDestroyed: false,
    };

    private destroyListeners: DestroyListener<Node>[] = [];

    constructor(private core: Core) {}

    public wraplet: WrapletApi = {
      status: this.status,

      addDestroyListener: (callback: DestroyListener<Node>) => {
        this.destroyListeners.push(callback);
      },

      initialize: async () => {
        await this.core.initializeChildren();
        this.status.isInitialized = true;
      },

      destroy: async () => {
        for (const listener of this.destroyListeners) {
          await listener(this);
        }
        this.status.isDestroyed = true;
      },

      accessNode: (callback: (node: Node) => void) => {
        callback(this.core.node);
      },
    };
  }

  it("Test DefaultCore not allowing required children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: true,
      },
    } as const satisfies WrapletChildrenMap;

    const node = document.createTextNode("test");

    const func1 = () => {
      const childrenManager = new DefaultCore(node, map);
      childrenManager.instantiateChildren();
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const childrenManager = new DefaultCore(node, {});
      childrenManager.instantiateChildren();
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
    } as const satisfies WrapletChildrenMap;

    const node = document.createTextNode("test");

    const core = new DefaultCore(node, map);
    expect(() => {
      core.instantiateChildren();
    }).not.toThrow();
  });

  it("should throw ChildrenAreNotAvailableError when accessing children before they are instantiated", () => {
    const node = document.createElement("div");
    const map = {} as const satisfies WrapletChildrenMap;
    const core = new DefaultCore(node, map);

    expect(() => core.children).toThrow(ChildrenAreNotAvailableError);
    expect(() => core.children).toThrow(
      "Wraplet is not yet fully initialized. You can fetch partial children with the 'uninitializedChildren' property.",
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateChildren();
      await core.initializeChildren();
      // For an unexplained reason "children" child turned out to be not an array.
      (core.children as any)["children"] = {
        isDestroyed: () => false,
      };
      await core.syncChildren();
    };

    await expect(func).rejects.toThrow(
      "Internal logic error. Expected a WrapletSet.",
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateChildren();
      await core.initializeChildren();
    };

    await expect(func).resolves.not.toThrow();
    expect(core.children["children"]).toBeNull();
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = async () => {
      core.instantiateChildren();
      await core.initializeChildren();
    };

    await expect(func).rejects.toThrow(ChildrenTooManyFoundError);
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateChildren();
    await core.initializeChildren();

    expect(core.children["children"]).toBeInstanceOf(DefaultWrapletSet);
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    const func = jest.fn();
    core.addDestroyChildListener(() => {
      func();
    });

    core.instantiateChildren();
    await core.initializeChildren();

    for (const child of core.children.children.values()) {
      await child.wraplet.destroy();
    }

    core.children.child?.wraplet.destroy();

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
    } as const satisfies WrapletChildrenMap;

    const func = jest.fn();

    const core: Core<Node, typeof map> = new DefaultCore(node, map);
    core.addInstantiateChildListener(() => {
      func();
    });

    core.instantiateChildren();
    await core.initializeChildren();
    expect(func).toHaveBeenCalledTimes(2);
    const newChildrenItem = document.createElement("div");
    newChildrenItem.setAttribute("data-children", "");
    node.appendChild(newChildrenItem);
    core.syncChildren();
    expect(func).toHaveBeenCalledTimes(3);

    const newChildItem = document.createElement("div");
    newChildrenItem.setAttribute("data-child", "");
    node.appendChild(newChildItem);

    core.syncChildren();
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
      private destroyListeners: DestroyListener<Node>[] = [];

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
        addDestroyListener: (callback: DestroyListener<Node>): void => {
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);
    core.instantiateChildren();
    await core.initializeChildren();

    // ArgCreator should be called once with proper WrapletCreatorArgs
    expect(createArgMock).toHaveBeenCalledTimes(1);
    const callArg = createArgMock.mock.calls[0][0];
    expect(callArg.Class).toBe(ArgAwareWraplet);
    expect(callArg.element).toBe(node.querySelector("[data-child]"));
    expect(callArg.args).toEqual([createdValue, 42, "plain"]);

    // The constructed wraplet should receive the processed value instead of the ArgCreator instance
    const child = core.children.child;
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateChildren();
    await core.initializeChildren();

    const func = async () => {
      await core.destroy();
      await core.destroy();
    };

    await expect(func).rejects.toThrow(ChildrenAreAlreadyDestroyedError);
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateChildren();
    await core.initializeChildren();

    const child = core.children["child"];
    (core.children as any)["child"] = null;

    const func1 = async () => {
      await child?.wraplet.destroy();
    };

    await expect(func1).rejects.toThrow(
      "Internal logic error. Destroyed child couldn't be removed because it's already null.",
    );

    // Re-sync children to fix an issue.
    core.syncChildren();
    expect(core.children["child"]).not.toBeNull();

    const childrenItems = core.children["children"];
    const childrenItem = Array.from(childrenItems)[0];
    childrenItems.delete(childrenItem);

    const func2 = async () => {
      await childrenItem?.wraplet.destroy();
    };

    await expect(func2).rejects.toThrow(
      "Internal logic error. Destroyed child couldn't be removed because it's not among the children.",
    );
  });

  it("Test DefaultCore user accessing non-existing children", async () => {
    const node = document.createElement("div");

    const map = {} as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateChildren();
    await core.initializeChildren();

    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (core.children as any)["child"];
    };

    expect(func).toThrow("Child 'child' has not been found.");
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);

    core.instantiateChildren();
    await core.initializeChildren();

    expect(core.children["children"].size).toBe(2);
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
    } as const satisfies WrapletChildrenMap;

    const core: Core<Node, typeof map> = new DefaultCore(node, map);
    core.instantiateChildren();
    await core.initializeChildren();

    const childElement = node.querySelector(`[${attribute}]`) as Element;

    const secondWraplet = new TestWrapletClass(
      new DefaultCore(childElement, {}),
    );
    core.children["children"].add(secondWraplet);

    const func = async () => {
      await core.syncChildren();
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
    } as const satisfies WrapletChildrenMap;

    const core = new DefaultCore(node, map);
    core.instantiateChildren();

    const initPromise = core.initializeChildren();
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
    } as const satisfies WrapletChildrenMap;

    const funcInstantiate = jest.fn();
    const funcDestroy = jest.fn();
    const core: Core<Node, typeof map> = new DefaultCore(node, map, {
      instantiateChildListeners: [
        (child) => {
          funcInstantiate();
          expect(child).toBeInstanceOf(TestWrapletClass);
        },
      ],
      destroyChildListeners: [
        (child) => {
          funcDestroy();
          expect(child).toBeInstanceOf(TestWrapletClass);
        },
      ],
    });
    core.instantiateChildren();
    await core.initializeChildren();

    await core.destroy();

    expect(funcInstantiate).toHaveBeenCalledTimes(1);
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
    const map = {} as const satisfies WrapletChildrenMap;

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
    } as const satisfies WrapletChildrenMap;

    const element = document.createElement("div");

    const elementChildrenItem = document.createElement("div");
    elementChildrenItem.setAttribute(attributeChildren, "");
    element.appendChild(elementChildrenItem);

    const elementChildItem = document.createElement("div");
    elementChildItem.setAttribute(attributeChild, "");
    element.appendChild(elementChildItem);

    const core = new DefaultCore(element, map);

    const func = jest.fn();

    const creator: WrapletCreator<Node, WrapletChildrenMap> = (args) => {
      expect(["child", "children"]).toContain(args.id);
      func();
      const core = new DefaultCore(args.element, {}, args.initOptions);
      return new args.Class(core, ...args.args);
    };

    core.setWrapletCreator(creator);

    core.instantiateChildren();
    await core.initializeChildren();

    expect(core.children.child).toBeInstanceOf(TestWrapletClass);
    expect(core.children.children.size).toBe(1);

    expect(func).toHaveBeenCalledTimes(2);
  });
});
