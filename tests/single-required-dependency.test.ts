import "./setup";
import { MissingRequiredDependencyError } from "../src/errors";
import { AbstractWraplet, WrapletDependencyMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet single dependency required", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletDependencySelectorAttribute = `${testWrapletSelectorAttribute}-dependency`;

  class TestWrapletDependency extends AbstractWraplet {}

  const dependenciesMap = {
    dependency: {
      selector: `[${testWrapletDependencySelectorAttribute}]`,
      Class: TestWrapletDependency,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  it("Test wraplet single dependency required succeeded", async () => {
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

  it("Test wraplet single dependency required failed", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const createWraplet = async () => {
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        dependenciesMap,
      );
      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }
      await wraplet.wraplet.initialize();
    };
    await expect(createWraplet()).rejects.toThrow(
      MissingRequiredDependencyError,
    );
  });
});
