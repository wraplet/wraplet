import "./setup";
import {
  DefaultCore,
  isWraplet,
  MapRepeat,
  Wraplet,
  WrapletChildrenMap,
} from "../src";
import { WrapletSymbol } from "../src/types/Wraplet";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

it("Test isWraplet", () => {
  class NoWrapletClass {}

  const noWraplet = new NoWrapletClass();

  expect(isWraplet(noWraplet)).toBe(false);

  class WrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    public isGettingInitialized: boolean = false;
    public isInitialized: boolean = true;
    public isGettingDestroyed: boolean = false;
    public isDestroyed: boolean = false;

    public accessNode(): void {}

    public addDestroyListener(): void {}

    public destroy(): void {}
  }

  const wraplet = new WrapletClass();

  expect(isWraplet(wraplet)).toBe(true);
});

describe("Test recursive wraplets", () => {
  it("Test directly recursive wraplets", () => {
    const attribute = "data-item";
    const childAttribute = `${attribute}-child`;

    class TestWraplet extends BaseElementTestWraplet<typeof map> {}

    // The circular dependency between the map and the TestWraplet confuses TypeScript. That's
    // why we need to clarify the map's type.
    const map: {
      readonly child: {
        readonly selector: (node: ParentNode) => Element[];
        readonly Class: typeof TestWraplet;
        readonly multiple: false;
        readonly required: false;
        readonly map: any;
      };
    } = {
      child: {
        selector: (node) => {
          return Array.from(node.children).filter((child) =>
            child.hasAttribute(childAttribute),
          );
        },
        Class: TestWraplet,
        multiple: false,
        required: false,
        map: MapRepeat.create(1),
      },
    } as const satisfies WrapletChildrenMap;

    document.body.innerHTML = `
<div ${attribute}>
    <div ${childAttribute}>
        <div ${childAttribute}>
            <div ${childAttribute}>
                <div ${childAttribute}></div>
            </div>
        </div>
    </div>
</div>
  `;

    const wraplet = TestWraplet.create<typeof map, TestWraplet>(attribute, map);

    if (!wraplet) {
      throw new Error("Wraplet not created.");
    }
    const func = jest.fn();

    let child = wraplet.getChild("child");
    func();

    if (!child) {
      throw new Error("Child not found.");
    }

    while ((child = child.getChild("child"))) {
      expect(child).toBeInstanceOf(TestWraplet);
      func();
    }

    expect(func).toHaveBeenCalledTimes(4);
  });

  it("Test two-level recursive wraplets", () => {
    const attribute = "data-item";
    const childAttribute = `${attribute}-child`;

    class TestWrapletChild extends BaseElementTestWraplet {}

    class TestWraplet extends BaseElementTestWraplet {}

    // The circular dependency between the map and the TestWrapletChild confuses TypeScript. That's
    // why we need to clarify the map's type.
    const map = {
      child: {
        selector: (node) => {
          return Array.from(node.children).filter((child) =>
            child.hasAttribute(childAttribute),
          );
        },
        // This allows us to reference TestWrapletChild later, when it will be defined.
        Class: TestWrapletChild,
        multiple: false,
        required: false,
        map: {
          childParent: {
            selector: (node) => {
              return Array.from(node.children).filter((child) =>
                child.hasAttribute(attribute),
              );
            },
            Class: TestWraplet,
            multiple: false,
            required: false,
            map: MapRepeat.create(2),
          },
        },
      },
    } as const satisfies WrapletChildrenMap;

    document.body.innerHTML = `
<div ${attribute} data-level="1">
    <div ${childAttribute} data-level="1-child">
        <div ${attribute} data-level="2">
            <div ${childAttribute} data-level="2-child">
                <div ${attribute} data-level="3">
                    <div ${childAttribute} data-level="3-child"></div>
                </div>
            </div>
        </div>
    </div>
</div>
  `;

    function getParent(child: TestWrapletChild): TestWraplet {
      const parent = child.getChild("childParent");
      if (!parent) {
        throw new Error("Parent not found.");
      }
      expect(parent).toBeInstanceOf(TestWraplet);
      if (!(parent instanceof TestWraplet)) {
        throw new Error("Parent is not an instance of TestWraplet.");
      }
      return parent;
    }

    function getChild(parent: TestWraplet): TestWrapletChild {
      const child = parent.getChild("child");
      if (!child) {
        throw new Error("Child not found.");
      }
      expect(child).toBeInstanceOf(TestWrapletChild);
      if (!(child instanceof TestWrapletChild)) {
        throw new Error("Parent is not an instance of TestWraplet.");
      }
      return child;
    }

    const mainElement = document.querySelector(`[${attribute}]`);

    if (!mainElement) {
      throw new Error("Main element not found.");
    }

    // We make sure that we start from a single instance of the TestWraplet. If we used the
    // "create" method here, then the TestWraplet would be created multiple times – once for each
    // element with the ${attribute}.
    const core = new DefaultCore(mainElement, map);
    const parent1 = new TestWraplet(core);

    if (!parent1) {
      throw new Error("Wraplet not created.");
    }

    const child1 = getChild(parent1);
    const parent2 = getParent(child1);
    const child2 = getChild(parent2);
    const parent3 = getParent(child2);
    getChild(parent3);
  });
});
