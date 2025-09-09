import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test wraplet single optional child", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet<any> {
    public hasElement(): boolean {
      return !!this.node;
    }
  }

  const childrenMap = {
    child: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  it("Test wraplet optional single child initialization", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create(
      testWrapletSelectorAttribute,
      childrenMap,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    expect(wraplet.getChild("child")).toBeInstanceOf(TestWrapletChild);
  });

  it("Test wraplet child has element", () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.create<typeof childrenMap, TestWraplet>(
      testWrapletSelectorAttribute,
      childrenMap,
    );
    if (!wraplet) {
      throw Error("Wraplet not initialized.");
    }
    expect(wraplet.getChild("child")?.hasElement()).toBeTruthy();
  });
});
