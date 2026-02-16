import "./setup";
import { MissingRequiredDependencyError } from "../src/errors";
import { AbstractWraplet, WrapletDependencyMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet multiple required dependencies", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletDependencySelectorAttribute = `${testWrapletSelectorAttribute}-dependency`;

  class TestWrapletDependency extends AbstractWraplet {}

  const dependenciesMap = {
    dependencies: {
      selector: `[${testWrapletDependencySelectorAttribute}]`,
      Class: TestWrapletDependency,
      multiple: true,
      required: true,
    },
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  // TESTS START HERE

  it("Test wraplet required dependencies initialization empty dependencies", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const getWraplet = async () => {
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        dependenciesMap,
      );
      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }
      await wraplet.wraplet.initialize();
    };
    await expect(getWraplet).rejects.toThrow(MissingRequiredDependencyError);
  });

  it("Test wraplet required dependencies initialization", async () => {
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
