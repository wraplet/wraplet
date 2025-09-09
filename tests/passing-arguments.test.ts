import "./setup";
import { AbstractWraplet, DefaultCore, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { Core } from "../src/types/Core";

describe("Test passing arguments", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractWraplet<any> {
    private someString: string;
    constructor(element: Element, stringArgument: string) {
      super(new DefaultCore(element, {}));
      this.someString = stringArgument;
    }
    public getSomeString(): string {
      return this.someString;
    }
  }

  const childrenMap = {
    child: {
      selector: `[${testWrapletChildSelectorAttribute}]`,
      Class: TestWrapletChild,
      multiple: false,
      required: false,
      args: [],
    },
  } as const satisfies WrapletChildrenMap;

  class TestWraplet<E extends Element = Element> extends BaseElementTestWraplet<
    typeof childrenMap
  > {
    private readonly someString: string;
    constructor(core: Core<typeof childrenMap, E>, stringArgument: string) {
      super(core);
      this.someString = stringArgument;
    }

    public getSomeString(): string {
      return this.someString;
    }

    public static createWithArguments<
      C extends BaseElementTestWraplet<typeof childrenMap>,
    >(selectorAttribute: string, someString: string): C | null {
      const wraplets = this.createWraplets(
        document,
        childrenMap,
        selectorAttribute,
        [someString],
      );

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
});
