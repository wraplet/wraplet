import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

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

class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }

  public hasNode(): boolean {
    return !!this.node;
  }
}

// TESTS START HERE

test("Test wraplet initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  expect(wraplet).toBeTruthy();
});

test("Test multiple wraplets initialization", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div><div ${testWrapletSelectorAttribute}><div ${testWrapletChildSelectorAttribute}></div></div>`;
  const wraplets = TestWraplet.createAll(testWrapletSelectorAttribute);
  expect(wraplets.length).toEqual(2);
});

test("Test wraplet has element", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.create<TestWraplet>(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  expect(wraplet.hasNode()).toBeTruthy();
});

test("Test wraplet's element is accessible", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const wraplet = TestWraplet.create(testWrapletSelectorAttribute);
  if (!wraplet) {
    throw Error("Wraplet not initialized.");
  }
  const callback = jest.fn((element: Element) => element);

  wraplet.accessNode((element) => {
    callback(element);
  });

  expect(callback).toHaveBeenCalledTimes(1);
});
