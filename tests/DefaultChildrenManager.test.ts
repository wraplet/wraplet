import "./setup";
import {
  DefaultChildrenManager,
  DefaultWrapletSet,
  destroyWrapletsRecursively,
  getWrapletsFromNode,
  Wraplet,
  WrapletChildrenMap,
} from "../src";
import {
  ChildrenAreAlreadyDestroyedError,
  ChildrenTooManyFoundError,
  MapError,
} from "../src/errors";
import { ChildrenManager } from "../src/types/ChildrenManager";
import { DestroyListener } from "../src/types/DestroyListener";
import { addWrapletToNode } from "../src/utils";
import { WrapletSymbol } from "../src/types/Wraplet";

describe("Test DefaultChildrenManager", () => {
  class TestWrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    isInitialized: boolean = false;

    private destroyListeners: DestroyListener<Node>[] = [];
    private _isDestroyed: boolean = false;

    constructor(private node: Node) {
      addWrapletToNode(this, node);
    }

    accessNode(callback: (node: Node) => void): void {
      callback(this.node);
    }

    addDestroyListener(callback: DestroyListener<Node>): void {
      this.destroyListeners.push(callback);
    }

    destroy(): void {
      for (const listener of this.destroyListeners) {
        listener(this);
      }
      this._isDestroyed = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isDestroyed(completely: boolean): boolean {
      return this._isDestroyed;
    }
  }

  it("Test DefaultChildrenManager not allowing children if provided node is not a ParentNode", () => {
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
      const childrenManager = new DefaultChildrenManager(node, map);
      childrenManager.instantiateChildren();
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const childrenManager = new DefaultChildrenManager(node, {});
      childrenManager.instantiateChildren();
    };

    expect(func2).not.toThrow(MapError);
  });

  it("Test DefaultChildrenManager internal error children expected a wraplet set", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    const func = () => {
      childrenManager.init();
      // For an unexplained reason "children" child turned out to be not an array.
      (childrenManager.children as any)["children"] = {
        isDestroyed: () => false,
      };
      childrenManager.syncChildren();
    };

    expect(func).toThrow("Internal logic error. Expected a WrapletSet.");
  });

  it("Test DefaultChildrenManager internal error multiple child instances on a single node", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    const func = () => {
      childrenManager.init();

      // For an unexplained reason one element has two instances of the "children" child.
      const elements = Array.from(node.querySelectorAll("[data-something]"));
      const wraplets = getWrapletsFromNode(elements[0]);

      addWrapletToNode(Array.from(wraplets)[0], elements[1]);

      childrenManager.syncChildren();
    };

    expect(func).toThrow(
      "Internal logic error. Multiple instances of the same child found on a single node.",
    );
  });

  it("Test DefaultChildrenManager child without selector", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    const func = () => {
      childrenManager.init();
    };

    expect(func).not.toThrow();
    expect(childrenManager.children["children"]).toBeNull();
  });

  it("Test DefaultChildrenManager too many elements found", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    const func = () => {
      childrenManager.init();
    };

    expect(func).toThrow(ChildrenTooManyFoundError);
  });

  it("Test DefaultChildrenManager multiple without selector", () => {
    const node = document.createElement("div");
    node.innerHTML = "<div data-something></div><div data-something></div>";

    const map = {
      children: {
        Class: TestWrapletClass,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    childrenManager.init();
    expect(childrenManager.children["children"]).toBeInstanceOf(
      DefaultWrapletSet,
    );
  });

  it("Test DefaultChildrenManager destroy children listeners", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    const func = jest.fn();
    childrenManager.addDestroyChildListener(() => {
      func();
    });

    childrenManager.init();
    destroyWrapletsRecursively(node);
    expect(func).toHaveBeenCalledTimes(3);
  });

  it("Test DefaultChildrenManager instantiate children listeners", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    const func = jest.fn();
    childrenManager.addInstantiateChildListener(() => {
      func();
    });

    childrenManager.init();
    expect(func).toHaveBeenCalledTimes(2);
    const newChildrenItem = document.createElement("div");
    newChildrenItem.setAttribute("data-children", "");
    node.appendChild(newChildrenItem);

    childrenManager.syncChildren();
    expect(func).toHaveBeenCalledTimes(3);

    const newChildItem = document.createElement("div");
    newChildrenItem.setAttribute("data-child", "");
    node.appendChild(newChildItem);

    childrenManager.syncChildren();
    expect(func).toHaveBeenCalledTimes(4);
  });

  it("Test DefaultChildrenManager cannot be destroyed twice", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    childrenManager.init();

    const func = () => {
      childrenManager.destroy();
      childrenManager.destroy();
    };

    expect(func).toThrow(ChildrenAreAlreadyDestroyedError);
  });

  it("Test DefaultChildrenManager child disappeared from parent before being destroyed", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    childrenManager.init();

    const child = childrenManager.children["child"];
    (childrenManager.children as any)["child"] = null;

    const func1 = () => {
      child?.destroy();
    };

    expect(func1).toThrow(
      "Internal logic error. Destroyed child couldn't be removed because it's already null.",
    );

    // Re-sync children to fix an issue.
    childrenManager.syncChildren();
    expect(childrenManager.children["child"]).not.toBeNull();

    const childrenItems = childrenManager.children["children"];
    const childrenItem = Array.from(childrenItems)[0];
    childrenItems.delete(childrenItem);

    const func2 = () => {
      childrenItem?.destroy();
    };

    expect(func2).toThrow(
      "Internal logic error. Destroyed child couldn't be removed because it's not among the children.",
    );
  });

  it("Test DefaultChildrenManager user accessing non-existing children", () => {
    const node = document.createElement("div");

    const map = {} as const satisfies WrapletChildrenMap;

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    childrenManager.init();

    const func = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (childrenManager.children as any)["child"];
    };

    expect(func).toThrow("Child has not been found.");
  });

  it("Test DefaultChildrenManager with selector callback", () => {
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

    const childrenManager: ChildrenManager<typeof map> =
      new DefaultChildrenManager(node, map);

    childrenManager.init();
    expect(childrenManager.children["children"].size).toBe(2);
  });
});
