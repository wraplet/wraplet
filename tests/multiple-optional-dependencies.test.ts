import "./setup";
import { AbstractWraplet, WrapletDependencyMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet multiple optional dependencies", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletDependencySelectorAttribute = `${testWrapletSelectorAttribute}-dependency`;

  class TestWrapletDependency extends AbstractWraplet {}

  const dependenciesMap = {
    dependencies: {
      selector: `[${testWrapletDependencySelectorAttribute}]`,
      Class: TestWrapletDependency,
      multiple: true,
      required: false,
    },
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  // TESTS START HERE

  it("Test wraplet optional dependencies initialization empty dependencies", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;

    const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
      testWrapletSelectorAttribute,
      dependenciesMap,
    );
    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }
    await wraplet.wraplet.initialize();
    const dependencies = wraplet.getDependency("dependencies");
    expect(dependencies.size).toBe(0);
  });

  it("Test wraplet optional dependencies initialization", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletDependencySelectorAttribute}></div><div ${testWrapletDependencySelectorAttribute}></div></div>`;

    const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
      testWrapletSelectorAttribute,
      dependenciesMap,
    );
    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }
    await wraplet.wraplet.initialize();
    const dependencies = wraplet.getDependency("dependencies");
    expect(dependencies.size).toBe(2);
  });
});
