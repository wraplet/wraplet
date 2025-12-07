import "./setup";
import { MissingRequiredChildError } from "../src/errors";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet multiple required children", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet {}

  const childrenMap = {
    children: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: true,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  // TESTS START HERE

  it("Test wraplet required children initialization empty children", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const getWraplet = async () => {
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        childrenMap,
      );
      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }
      await wraplet.initialize();
    };
    await expect(getWraplet).rejects.toThrow(MissingRequiredChildError);
  });

  it("Test wraplet required children initialization", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div><div ${testWrapletChildSelectorAttribute}></div></div>`;

    const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
      testWrapletSelectorAttribute,
      childrenMap,
    );
    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }
    await wraplet.initialize();
    const children = wraplet.getChild("children");
    expect(children.size).toBe(2);
  });
});
