import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet multiple optional children", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet {}

  const childrenMap = {
    children: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: true,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  // TESTS START HERE

  it("Test wraplet optional children initialization empty children", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;

    const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
      testWrapletSelectorAttribute,
      childrenMap,
    );
    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }
    const children = wraplet.getChild("children");
    expect(children.size).toBe(0);
  });

  it("Test wraplet optional children initialization", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div><div ${testWrapletChildSelectorAttribute}></div></div>`;

    const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
      testWrapletSelectorAttribute,
      childrenMap,
    );
    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }
    const children = wraplet.getChild("children");
    expect(children.size).toBe(2);
  });
});
