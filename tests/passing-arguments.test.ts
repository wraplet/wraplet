import "./setup";
import { AbstractDependentWraplet, DDM, WrapletDependencyMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { DependencyManager } from "../src/DependencyManager/types/DependencyManager";

describe("Test passing arguments", () => {
  const testWrapletSelectorAttribute = "data-test-selector";
  const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

  class TestWrapletChild extends AbstractDependentWraplet<any> {
    private someString: string;
    constructor(element: Element, stringArgument: string) {
      super(new DDM(element, {}));
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
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
    private readonly someString: string;
    constructor(
      dm: DependencyManager<Element, typeof childrenMap>,
      stringArgument: string,
    ) {
      super(dm);
      this.someString = stringArgument;
    }

    public getSomeString(): string {
      return this.someString;
    }

    public static createWithArguments(
      selectorAttribute: string,
      someString: string,
    ) {
      const wraplets = this.createDependentWraplets(
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
    const wraplet = TestWraplet.createWithArguments(
      testWrapletSelectorAttribute,
      str,
    );

    if (!wraplet) {
      throw new Error("Wraplet not initialized.");
    }

    expect(wraplet.getSomeString()).toBe(str);
  });
});
