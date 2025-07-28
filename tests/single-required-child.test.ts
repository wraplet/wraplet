import "./setup";
import { MissingRequiredChildError } from "../src/errors";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet single child required", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet<any> {
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const childrenMap = {
    child: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    protected defineChildrenMap(): typeof childrenMap {
      return childrenMap;
    }
  }

  it("Test wraplet single child required succeeded", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    expect(wraplet.getChild("child")).toBeInstanceOf(TestWrapletChild);
  });

  it("Test wraplet single child required failed", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const createWraplet = () => {
      TestWraplet.create(testWrapletSelectorAttribute);
    };
    expect(createWraplet).toThrow(MissingRequiredChildError);
  });
});
