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
}

const childrenMap = {
  child: {
    selector: `[${testWrapletChildSelectorAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: false,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }

  public hasElement(): boolean {
    return !!this.element;
  }
}

// TESTS START HERE

test("Test wraplet initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  expect(wraplet).toBeTruthy();
});

test("Test multiple wraplets initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div><div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplets = TestWraplet.createAll<TestWraplet>(
    testWrapletSelectorAttribute,
  );
  expect(wraplets.length).toEqual(2);
});

test("Test wraplet has element", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.hasElement()).toBeTruthy();
});
