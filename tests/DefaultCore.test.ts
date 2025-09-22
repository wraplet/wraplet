import "./setup";
import {
  DefaultCore,
  DefaultWrapletSet,
  Wraplet,
  WrapletChildrenMap,
} from "../src";
import {
  ChildrenAreAlreadyDestroyedError,
  ChildrenTooManyFoundError,
  MapError,
} from "../src/errors";
import { Core } from "../src/types/Core";
import { DestroyListener } from "../src/types/DestroyListener";
import { addWrapletToNode } from "../src/utils";
import { WrapletSymbol } from "../src/types/Wraplet";

describe("Test DefaultCore", () => {
  class TestWrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    public isGettingInitialized: boolean = false;
    public isInitialized: boolean = false;
    public isGettingDestroyed: boolean = false;
    public isDestroyed: boolean = false;

    private destroyListeners: DestroyListener<Node>[] = [];

    constructor(private core: Core) {
      addWrapletToNode(this, core.node);
    }

    accessNode(callback: (node: Node) => void): void {
      callback(this.core.node);
    }

    addDestroyListener(callback: DestroyListener<Node>): void {
      this.destroyListeners.push(callback);
    }

    destroy(): void {
      for (const listener of this.destroyListeners) {
        listener(this);
      }
      this.isDestroyed = true;
    }
  }

  it("Test DefaultCore not allowing children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: TestWrapletClass,
        multiple: false,
        required: false,
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

  it("Test DefaultCore internal error children expected a wraplet set", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);

    const func = () => {
      core.init();
      // For an unexplained reason "children" child turned out to be not an array.
      (core.children as any)["children"] = {
        isDestroyed: () => false,
      };
      core.syncChildren();
    };

    expect(func).toThrow("Internal logic error. Expected a WrapletSet.");
  });

  it("Test DefaultCore child without selector", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const core: Core<typeof map> = new DefaultCore(node, map);

    const func = () => {
      core.init();
    };

    expect(func).not.toThrow();
    expect(core.children["children"]).toBeNull();
  });

  it("Test DefaultCore too many elements found", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);

    const func = () => {
      core.init();
    };

    expect(func).toThrow(ChildrenTooManyFoundError);
  });

  it("Test DefaultCore multiple without selector", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div><div data-something></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const core: Core<typeof map> = new DefaultCore(node, map);

    core.init();
    expect(core.children["children"]).toBeInstanceOf(DefaultWrapletSet);
  });

  it("Test DefaultCore destroy children listeners", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);

    const func = jest.fn();
    core.addDestroyChildListener(() => {
      func();
    });

    core.init();

    for (const child of core.children.children.values()) {
      child.destroy();
    }

    core.children.child?.destroy();

    expect(func).toHaveBeenCalledTimes(3);
  });

  it("Test DefaultCore instantiate children listeners", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);
    core.addInstantiateChildListener(() => {
      func();
    });

    core.init();
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

  it("Test DefaultCore cannot be destroyed twice", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);

    core.init();

    const func = () => {
      core.destroy();
      core.destroy();
    };

    expect(func).toThrow(ChildrenAreAlreadyDestroyedError);
  });

  it("Test DefaultCore child disappeared from parent before being destroyed", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);

    core.init();

    const child = core.children["child"];
    (core.children as any)["child"] = null;

    const func1 = () => {
      child?.destroy();
    };

    expect(func1).toThrow(
      "Internal logic error. Destroyed child couldn't be removed because it's already null.",
    );

    // Re-sync children to fix an issue.
    core.syncChildren();
    expect(core.children["child"]).not.toBeNull();

    const childrenItems = core.children["children"];
    const childrenItem = Array.from(childrenItems)[0];
    childrenItems.delete(childrenItem);

    const func2 = () => {
      childrenItem?.destroy();
    };

    expect(func2).toThrow(
      "Internal logic error. Destroyed child couldn't be removed because it's not among the children.",
    );
  });

  it("Test DefaultCore user accessing non-existing children", () => {
    const node = document.createElement("div");

    const map = {} as const satisfies WrapletChildrenMap;

    const core: Core<typeof map> = new DefaultCore(node, map);

    core.init();

    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (core.children as any)["child"];
    };

    expect(func).toThrow("Child 'child' has not been found.");
  });

  it("Test DefaultCore with selector callback", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);

    core.init();
    expect(core.children["children"].size).toBe(2);
  });

  it("Test DefaultCore multiple instances wrapping the same element error", () => {
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

    const core: Core<typeof map> = new DefaultCore(node, map);
    core.init();

    const childElement = node.querySelector(`[${attribute}]`) as Element;

    const secondWraplet = new TestWrapletClass(
      new DefaultCore(childElement, {}),
    );
    core.children["children"].add(secondWraplet);

    const func = () => {
      core.syncChildren();
    };

    expect(func).toThrow(
      "Internal logic error. Multiple instances wrapping the same element found in the core.",
    );
  });

  it("Test DefaultCore initOptions", () => {
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
    const core: Core<typeof map> = new DefaultCore(node, map, {
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
    core.init();

    core.destroy();

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
});
