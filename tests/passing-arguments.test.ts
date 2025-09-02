import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { DeepWriteable } from "../src/types/Utils";

describe("Test passing arguments", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet<any> {
    private someString: string;
    constructor(element: Element, stringArgument: string) {
      super(element);
      this.someString = stringArgument;
    }
    public getSomeString(): string {
      return this.someString;
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  const childrenMap = {
    child: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: false,
      args: [] as unknown[],
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet<E extends Element = Element> extends BaseElementTestWraplet<
    typeof childrenMap
  > {
    private readonly someString: string;
    constructor(element: E, stringArgument: string) {
      const mapAlter = function (map: DeepWriteable<typeof childrenMap>) {
        map["child"]["args"] = [stringArgument];
      };
      super(element, {
        mapAlterCallback: mapAlter,
      });
      this.someString = stringArgument;
    }

    public getSomeString(): string {
      return this.someString;
    }

    protected defineChildrenMap(): typeof childrenMap {
      return childrenMap;
    }

    public static createWithArguments<
      C extends BaseElementTestWraplet<typeof childrenMap>,
    >(selectorAttribute: string, someString: string): C | null {
      const wraplets = this.createWraplets(document, selectorAttribute, [
        someString,
      ]);

      if (wraplets.length === 0) {
        return null;
      }

      return wraplets[0];
    }
  }

  it("Test basic arguments pass", () => {
    const str = "some string";
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const wraplet = TestWraplet.createWithArguments<TestWraplet>(
      testWrapletSelectorAttribute,
      str,
    );

    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }

    expect(wraplet.getSomeString()).toBe(str);
  });

  it("Test passing arguments to child by mapAlter callback", () => {
    const str = "some string";
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
    const wraplet = TestWraplet.createWithArguments<TestWraplet>(
      testWrapletSelectorAttribute,
      str,
    );

    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }

    const child = wraplet.getChild("child");
    if (!child) {
      throw new Error("Wraplet child not initialized.");
    }

    expect(child.getSomeString()).toBe(str);
  });
});
