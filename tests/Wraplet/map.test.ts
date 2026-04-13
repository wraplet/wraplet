import "../setup";
import { AbstractDependentWraplet, DDM, WrapletDependencyMap } from "../../src";
import { BaseElementTestWraplet } from "../resources/BaseElementTestWraplet";
import { MapError } from "../../src/errors";

describe("Test wraplet map", () => {
  const testWrapletSelectorAttribute = "data-test-selector";

  class TestWrapletChild extends AbstractDependentWraplet<any> {}

  const childrenMap = {
    children: {
      Class: TestWrapletChild,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {}

  class TestNodeWraplet extends AbstractDependentWraplet<
    Node,
    typeof childrenMap
  > {
    constructor(node: Node) {
      super(new DDM(node, childrenMap));
    }
  }

  // TESTS START HERE

  it("Test that 'required' and missing selector are mutually exclusive", async () => {
    document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
    const createWraplet = async () => {
      const wraplet = TestWraplet.create(
        testWrapletSelectorAttribute,
        childrenMap,
      );
      if (!wraplet) {
        throw new Error("Wraplet not created.");
      }
      await wraplet.wraplet.initialize();
    };
    await expect(createWraplet()).rejects.toThrow(MapError);
  });

  it("Test that map has to be empty if wrapped node cannot have children", async () => {
    const textNode = document.createTextNode("test");
    const createNodeWraplet = async () => {
      const wraplet = new TestNodeWraplet(textNode);
      await wraplet.wraplet.initialize();
    };
    await expect(createNodeWraplet()).rejects.toThrow(MapError);
  });
});
