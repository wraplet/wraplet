/**
 * @jest-environment jsdom
 */
import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseTestWraplet } from "./resources/BaseTestWraplet";
import { MapError } from "../src/errors";

const testWrapletSelectorAttribute = "data-test-selector";

class TestWrapletChild extends AbstractWraplet<any> {
  protected defineChildrenMap(): {} {
    return {};
  }
}

const childrenMap = {
  children: {
    Class: TestWrapletChild,
    multiple: false,
    required: true,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
}

// TESTS START HERE

test("Test that `required` and missing selector are mutually exclusive", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const createWraplet = () => {
    TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  };
  expect(createWraplet).toThrowError(MapError);
});
