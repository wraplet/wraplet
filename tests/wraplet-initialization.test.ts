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

class TestWraplet<E extends Element = Element> extends BaseTestWraplet<
  typeof childrenMap,
  E
> {
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
  const wraplet = TestWraplet.create<HTMLElement>(testWrapletSelectorAttribute);
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
  const wraplet = TestWraplet.create<HTMLElement, TestWraplet<HTMLElement>>(
    testWrapletSelectorAttribute,
  );
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.hasElement()).toBeTruthy();
});

test("Test wraplet's element is accessible", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.create<HTMLElement, TestWraplet<HTMLElement>>(
    testWrapletSelectorAttribute,
  );
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  const callback = jest.fn((element: HTMLElement) => element);

  wraplet.accessElement((element) => {
    callback(element);
  });

  expect(callback).toHaveBeenCalledTimes(1);
});
