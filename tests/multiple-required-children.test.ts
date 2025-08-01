import "./setup";
import { MissingRequiredChildError } from "../src/errors";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet multiple required children", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet<any> {
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const childrenMap = {
    children: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: true,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    protected defineChildrenMap(): typeof childrenMap {
      return childrenMap;
    }
  }

  // TESTS START HERE

  it("Test wraplet required children initialization empty children", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const getWraplet = () => {
      TestWraplet.create(testWrapletSelectorAttribute);
    };
    expect(getWraplet).toThrow(MissingRequiredChildError);
  });

  it("Test wraplet required children initialization", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div><div ${testWrapletChildSelectorAttribute}></div></div>`;

    const wraplet = TestWraplet.create<TestWraplet>(
      testWrapletSelectorAttribute,
    );
    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }
    const children = wraplet.getChild("children");
    expect(children.size).toBe(2);
  });
});
