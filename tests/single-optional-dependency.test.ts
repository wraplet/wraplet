import "./setup";
import { AbstractWraplet, WrapletDependencyMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet single optional dependency", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletDependencySelectorAttribute = `${testWrapletSelectorAttribute}-dependency`;

  class TestWrapletDependency extends AbstractWraplet {
    public hasElement(): boolean {
      return !!this.node;
    }
  }

  const dependenciesMap = {
    dependency: {
      selector: `[${testWrapletDependencySelectorAttribute}]`,
      Class: TestWrapletDependency,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  it("Test wraplet optional single dependency initialization", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletDependencySelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create(
      testWrapletSelectorAttribute,
      dependenciesMap,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    await wraplet.wraplet.initialize();
    expect(wraplet.getDependency("dependency")).toBeInstanceOf(
      TestWrapletDependency,
    );
  });

  it("Test wraplet dependency has element", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletDependencySelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
      testWrapletSelectorAttribute,
      dependenciesMap,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    await wraplet.wraplet.initialize();
    expect(wraplet.getDependency("dependency")?.hasElement()).toBeTruthy();
  });

  it("should return empty node tree dependencies when optional dependency is missing", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
      testWrapletSelectorAttribute,
      dependenciesMap,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    await wraplet.wraplet.initialize();
    expect(wraplet.getDependency("dependency")).toBeNull();
    expect(wraplet.wraplet.getChildrenDependencies()).toHaveLength(0);
  });
});
