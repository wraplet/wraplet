import "../setup";
import {
  Core,
  isWraplet,
  Wraplet,
  WrapletDependencyMap,
  WrapletApi,
} from "../../src";
import { WrapletSymbol } from "../../src";
import { BaseElementTestWraplet } from "../resources/BaseElementTestWraplet";
import { Injector } from "../../src/Injector/types/Injector";
import { CoreOptions } from "../../src/DependencyManager/types/CoreOptions";
import { WrapletApiSymbol } from "../../src/Wraplet/types/WrapletApi";

it("Test isWraplet", () => {
  class NoWrapletClass {}

  const noWraplet = new NoWrapletClass();

  expect(isWraplet(noWraplet)).toBe(false);

  class WrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    wraplet: WrapletApi = {
      [WrapletApiSymbol]: true,
      destroy: async () => {},
      initialize: async () => {},
      status: {
        isGettingInitialized: false,
        isInitialized: false,
        isDestroyed: false,
        isGettingDestroyed: false,
      },
      addDestroyListener() {},
      accessNode: () => {},
    } as WrapletApi;
  }

  const wraplet = new WrapletClass();

  expect(isWraplet(wraplet)).toBe(true);
});

describe("Test recursive wraplets", () => {
  it("Test directly recursive wraplets", async () => {
    const attribute = "data-item";
    const dependencyAttribute = `${attribute}-dependency`;

    class TestWraplet extends BaseElementTestWraplet<typeof map> {}

    // The circular dependency between the map and the TestWraplet confuses TypeScript. That's
    // why we need to clarify the map's type.
    const map: {
      readonly dependency: {
        readonly selector: (node: ParentNode) => Element[];
        readonly Class: typeof TestWraplet;
        readonly multiple: false;
        readonly injector: Injector<Node, WrapletDependencyMap, CoreOptions>;
        readonly required: false;
      };
    } = {
      dependency: {
        selector: (node) => {
          return Array.from(node.children).filter((dependency) =>
            dependency.hasAttribute(dependencyAttribute),
          );
        },
        Class: TestWraplet,
        injector: Core.createInjector(1),
        multiple: false,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    document.body.innerHTML = `
<div ${attribute}>
    <div ${dependencyAttribute}>
        <div ${dependencyAttribute}>
            <div ${dependencyAttribute}>
                <div ${dependencyAttribute}></div>
            </div>
        </div>
    </div>
</div>
  `;

    const wraplet = TestWraplet.create<typeof map, TestWraplet>(attribute, map);

    if (!wraplet) {
      throw new Error("Wraplet not created.");
    }
    await wraplet.wraplet.initialize();
    const func = jest.fn();

    let dependency = wraplet.getDependency("dependency");
    func();

    if (!dependency) {
      throw new Error("Dependency not found.");
    }

    while ((dependency = dependency.getDependency("dependency"))) {
      expect(dependency).toBeInstanceOf(TestWraplet);
      func();
    }

    expect(func).toHaveBeenCalledTimes(4);
  });

  it("Test two-level recursive wraplets", async () => {
    const attribute = "data-item";
    const dependencyAttribute = `${attribute}-dependency`;

    class TestWrapletDependency<
      M extends WrapletDependencyMap = WrapletDependencyMap,
    > extends BaseElementTestWraplet<M> {}

    class TestWraplet<
      M extends WrapletDependencyMap = WrapletDependencyMap,
    > extends BaseElementTestWraplet<M> {}

    const map = {
      dependency: {
        selector: (node) => {
          return Array.from(node.children).filter((dependency) =>
            dependency.hasAttribute(dependencyAttribute),
          );
        },
        // This allows us to reference TestWrapletDependency later, when it will be defined.
        Class: TestWrapletDependency,
        multiple: false,
        required: false,
        injector: Core.createInjector({
          dependencyParent: {
            selector: (node) => {
              return Array.from(node.children).filter((dependency) =>
                dependency.hasAttribute(attribute),
              );
            },
            Class: TestWraplet,
            multiple: false,
            required: false,
            injector: Core.createInjector(2),
          },
        }),
      },
    } satisfies WrapletDependencyMap;

    document.body.innerHTML = `
<div ${attribute} data-level="1">
    <div ${dependencyAttribute} data-level="1-dependency">
        <div ${attribute} data-level="2">
            <div ${dependencyAttribute} data-level="2-dependency">
                <div ${attribute} data-level="3">
                    <div ${dependencyAttribute} data-level="3-dependency"></div>
                </div>
            </div>
        </div>
    </div>
</div>
  `;

    function getParent<M extends WrapletDependencyMap>(
      dependency: TestWrapletDependency<M>,
    ): TestWraplet {
      const parent = dependency.getDependency("dependencyParent");
      if (!parent) {
        throw new Error("Parent not found.");
      }
      expect(parent).toBeInstanceOf(TestWraplet);
      if (!(parent instanceof TestWraplet)) {
        throw new Error("Parent is not an instance of TestWraplet.");
      }
      return parent;
    }

    function getDependency<M extends WrapletDependencyMap>(
      parent: TestWraplet<M>,
    ): TestWrapletDependency {
      const dependency = parent.getDependency("dependency");
      if (!dependency) {
        throw new Error("Dependency not found.");
      }
      expect(dependency).toBeInstanceOf(TestWrapletDependency);
      if (!(dependency instanceof TestWrapletDependency)) {
        throw new Error("Parent is not an instance of TestWraplet.");
      }
      return dependency;
    }

    const mainElement = document.querySelector(`[${attribute}]`);

    if (!mainElement) {
      throw new Error("Main element not found.");
    }

    // We make sure that we start from a single instance of the TestWraplet. If we used the
    // "create" method here, then the TestWraplet would be created multiple times – once for each
    // element with the ${attribute}.
    const core = new Core(mainElement, map);
    const parent1 = new TestWraplet(core);

    if (!parent1) {
      throw new Error("Wraplet not created.");
    }

    await parent1.wraplet.initialize();

    const dependency1 = getDependency(parent1);
    const parent2 = getParent(dependency1);
    const dependency2 = getDependency(parent2);
    const parent3 = getParent(dependency2);
    getDependency(parent3);
  });
});
