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
  child: {
    selector: `[${testWrapletChildSelectorAttribute}]`,
    Class: TestWrapletChild,
    multiple: false,
    required: true,
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

test("Test wraplet single child required", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.getChild("child")).toBeInstanceOf(TestWrapletChild);
});

test("Test wraplet single child required failed", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const createWraplet = () => {
    TestWraplet.create(testWrapletSelectorAttribute);
  };
  expect(createWraplet).toThrowError(MissingRequiredChildError);
});
