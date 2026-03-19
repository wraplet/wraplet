import {
  AbstractDependentWraplet,
  AbstractWraplet,
  Core,
  UnsupportedNodeTypeError,
} from "../src";

describe("Unsupported node type", () => {
  it("should throw UnsupportedNodeTypeError if the node type is not supported", () => {
    class TestWraplet extends AbstractDependentWraplet<HTMLDivElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLDivElement]);
      }
    }

    const span = document.createElement("span");
    const core = new Core(span, {});

    expect(() => new TestWraplet(core as any)).toThrow(
      UnsupportedNodeTypeError,
    );
    expect(() => new TestWraplet(core as any)).toThrow(
      "Node type HTMLSpanElement is not supported by the TestWraplet wraplet.",
    );
  });

  it("should NOT throw if the node type IS supported", () => {
    class TestWraplet extends AbstractDependentWraplet<HTMLDivElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLDivElement]);
      }
    }

    const div = document.createElement("div");
    const core = new Core(div, {});

    expect(() => new TestWraplet(core as any)).not.toThrow();
  });

  it("should skip multiple children instantiation and warn if some child node types are not supported", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    class UnsupportedChildWraplet extends AbstractWraplet<HTMLElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLSpanElement]); // Only supports spans
      }
    }

    class ParentWraplet extends AbstractDependentWraplet<
      HTMLDivElement,
      {
        children: {
          Class: typeof UnsupportedChildWraplet;
          selector: "span, div";
          multiple: true;
          required: false;
        };
      }
    > {}

    const div = document.createElement("div");
    div.innerHTML = "<span></span><div></div>";

    const core = new Core(div, {
      children: {
        Class: UnsupportedChildWraplet,
        selector: "span, div",
        required: false,
        multiple: true,
      },
    });

    const parent = new ParentWraplet(core as any);
    await parent.wraplet.initialize();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Node type HTMLDivElement is not supported by the UnsupportedChildWraplet wraplet. Skipping instantiation of the "children" dependency.',
    );

    consoleSpy.mockRestore();
  });

  it("should rethrow other errors during child instantiation", async () => {
    class ErrorChildWraplet extends AbstractWraplet {
      constructor(node: Node) {
        super(node);
        throw new Error("Some other error");
      }
    }

    class ParentWraplet extends AbstractDependentWraplet<
      HTMLSpanElement,
      {
        child: {
          Class: typeof ErrorChildWraplet;
          selector: "div";
          required: false;
          multiple: false;
        };
      }
    > {}

    const span = document.createElement("span");
    span.innerHTML = "<div data-child></div>";

    const core = new Core(span, {
      child: {
        Class: ErrorChildWraplet,
        selector: "div",
        required: false,
        multiple: false,
      },
    });

    const throwFunc = async () => {
      new ParentWraplet(core as any);
    };

    await expect(throwFunc).rejects.toThrow("Some other error");
  });

  it("should throw if a required single child node type is not supported", async () => {
    class UnsupportedChildWraplet extends AbstractWraplet<HTMLElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLSpanElement]); // Only supports spans
      }
    }

    class ParentWraplet extends AbstractDependentWraplet<
      HTMLDivElement,
      {
        child: {
          Class: typeof UnsupportedChildWraplet;
          selector: "div";
          multiple: false;
          required: true;
        };
      }
    > {}

    const div = document.createElement("div");
    div.innerHTML = "<div></div>";

    const core = new Core(div, {
      child: {
        Class: UnsupportedChildWraplet,
        selector: "div",
        required: true,
        multiple: false,
      },
    });

    const throwFunc = async () => {
      new ParentWraplet(core as any);
    };

    await expect(throwFunc).rejects.toThrow(UnsupportedNodeTypeError);
  });

  it("should pass if descendant has been provided", async () => {
    class TestWraplet extends AbstractDependentWraplet<HTMLElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLElement]);
      }
    }

    const div = document.createElement("div");
    const core = new Core(div, {});

    expect(() => new TestWraplet(core)).not.toThrow();
  });
});
