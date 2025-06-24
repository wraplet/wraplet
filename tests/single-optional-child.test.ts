/**
 * @jest-environment jsdom
 */

import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseTestWraplet } from "./resources/BaseTestWraplet";

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletChildSelectorAttribute = `${testWrapletSelectorAttribute}-child`;

class TestWrapletChild extends AbstractWraplet<any> {
  protected defineChildrenMap(): {} {
    return {};
  }

  public hasElement(): boolean {
    return !!this.element;
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

class TestWraplet<E extends Element = Element> extends BaseTestWraplet<
  typeof childrenMap,
  E
> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
}

// TESTS START HERE

test("Test wraplet optional single child initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.getChild("child")).toBeInstanceOf(TestWrapletChild);
});

test("Test wraplet child has element", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.create<HTMLElement, TestWraplet<HTMLElement>>(
    testWrapletSelectorAttribute,
  );
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.getChild("child")?.hasElement()).toBeTruthy();
});
