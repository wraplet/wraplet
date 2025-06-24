/**
 * @jest-environment jsdom
 */
import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseTestWraplet } from "./resources/BaseTestWraplet";
import { DeepWriteable } from "../src/types/Utils";

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

class TestWraplet<E extends Element = Element> extends BaseTestWraplet<
  typeof childrenMap,
  E
> {
  private readonly someString: string;
  constructor(element: E, stringArgument: string) {
    const mapAlter = function (map: DeepWriteable<typeof childrenMap>) {
      map["child"]["args"] = [stringArgument];
    };
    super(element, mapAlter);
    this.someString = stringArgument;
  }

  public getSomeString(): string {
    return this.someString;
  }

  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }

  public static createWithArguments<
    C extends BaseTestWraplet<WrapletChildrenMap>,
  >(selectorAttribute: string, someString: string): C | null {
    const wraplets = this.createWraplets(
      document,
      [someString],
      `[${selectorAttribute}]`,
    );
    if (wraplets.length === 0) {
      return null;
    }

    return wraplets[0];
  }
}

// TESTS START HERE

test("Test passing arguments", () => {
  const str = "some string";
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.createWithArguments<TestWraplet>(
    testWrapletSelectorAttribute,
    str,
  );

  expect(wraplet?.getSomeString()).toBe(str);
});

test("Test passing arguments to child", () => {
  const str = "some string";
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.createWithArguments<TestWraplet>(
    testWrapletSelectorAttribute,
    str,
  );

  const child = wraplet?.getChild("child");
  if (!child) {
    throw new Error("Wraplet child not initialized.");
  }

  expect(child.getSomeString()).toBe(str);
});
