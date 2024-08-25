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
  children: {
    selector: `[${testWrapletChildSelectorAttribute}]`,
    Class: TestWrapletChild,
    multiple: true,
    required: false,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
}

// TESTS START HERE

test("Test wraplet optional children initialization empty children", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;

  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  const children = wraplet.getChild("children");
  expect(children).toHaveLength(0);
});

test("Test wraplet optional children initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div><div ${testWrapletChildSelectorAttribute}></div></div>`;

  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  const children = wraplet.getChild("children");
  expect(children).toHaveLength(2);
});
