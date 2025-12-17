import "./setup";
import { MissingRequiredChildError } from "../src/errors";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet single child required", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet {}

  const childrenMap = {
    child: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  it("Test wraplet single child required succeeded", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create(
      testWrapletSelectorAttribute,
      childrenMap,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    await wraplet.wraplet.initialize();
    expect(wraplet.getChild("child")).toBeInstanceOf(TestWrapletChild);
  });

  it("Test wraplet single child required failed", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const createWraplet = async () => {
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        childrenMap,
      );
      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }
      await wraplet.wraplet.initialize();
    };
    await expect(createWraplet()).rejects.toThrow(MissingRequiredChildError);
  });
});
