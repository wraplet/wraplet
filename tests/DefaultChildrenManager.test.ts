import "./setup";
import { DefaultChildrenManager, Wraplet, WrapletChildrenMap } from "../src";
import { ChildrenExpectedArrayError, MapError } from "../src/errors";
import { ChildrenManager } from "../src/types/ChildrenManager";
import { DestroyListener } from "../src/types/DestroyListener";

describe("Test DefaultChildrenManager", () => {
  class WrapletClassMock implements Wraplet {
    isInitialized: boolean = false;
    isWraplet: true = true;

    private destroyListeners: DestroyListener<Node>[] = [];
    private _isDestroyed: boolean = false;

    constructor(private node: Node) {}

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
        Class: WrapletClassMock,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const node = document.createTextNode("test");

    const func1 = () => {
      const childrenManager = new DefaultChildrenManager(node, map);
      childrenManager.instantiateChildren(node);
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const childrenManager = new DefaultChildrenManager(node, {});
      childrenManager.instantiateChildren(node);
    };

    expect(func2).not.toThrow(MapError);
  });

  it("Test DefaultChildrenManager internal error children expected array", () => {
    const node = document.createElement("div");
    node.innerHTML = `
  <div data-something></div>
  <div data-something></div>
`;

    const map = {
      children: {
        selector: "[data-something]",
        Class: WrapletClassMock,
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
      childrenManager.syncChildren(node);
    };

    expect(func).toThrow(ChildrenExpectedArrayError);
  });
});
