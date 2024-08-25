/**
 * @jest-environment jsdom
 */
import "./setup";
import { MissingRequiredChildError } from "../src/errors";
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
    required: true,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
}

// TESTS START HERE

test("Test wraplet required children initialization empty children", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const getWraplet = () => {
    TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  };
  expect(getWraplet).toThrowError(MissingRequiredChildError);
});

test("Test wraplet required children initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div><div ${testWrapletChildSelectorAttribute}></div></div>`;

  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  const children = wraplet.getChild("children");
  expect(children).toHaveLength(2);
});
