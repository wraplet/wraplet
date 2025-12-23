import { AbstractWraplet, DefaultCore, UnsupportedNodeTypeError } from "../src";

describe("Unsupported node type", () => {
  it("should throw UnsupportedNodeTypeError if the node type is not supported", () => {
    class TestWraplet extends AbstractWraplet<HTMLDivElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLDivElement]);
      }
    }

    const span = document.createElement("span");
    const core = new DefaultCore(span, {});

    expect(() => new TestWraplet(core as any)).toThrow(
      UnsupportedNodeTypeError,
    );
    expect(() => new TestWraplet(core as any)).toThrow(
      "Node type HTMLSpanElement is not supported by the TestWraplet wraplet.",
    );
  });

  it("should NOT throw if the node type IS supported", () => {
    class TestWraplet extends AbstractWraplet<HTMLDivElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLDivElement]);
      }
    }

    const div = document.createElement("div");
    const core = new DefaultCore(div, {});

    expect(() => new TestWraplet(core as any)).not.toThrow();
  });

  it("should skip multiple children instantiation and warn if some child node types are not supported", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    class UnsupportedChildWraplet extends AbstractWraplet<HTMLElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLSpanElement]); // Only supports spans
      }
    }

    class ParentWraplet extends AbstractWraplet<
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

    const core = new DefaultCore(div, {
      children: {
        Class: UnsupportedChildWraplet,
        selector: "span, div",
        required: false,
        multiple: true,
      },
    });

    const parent = new ParentWraplet(core as any);
    await parent.wraplet.initialize();

    // One span should be instantiated, one div should be skipped.
    expect(parent.wraplet.getNodeTreeChildren()).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Node type HTMLDivElement is not supported by the UnsupportedChildWraplet wraplet. Skipping instantiation of the "children" child.',
    );

    consoleSpy.mockRestore();
  });

  it("should rethrow other errors during child instantiation", async () => {
    class ErrorChildWraplet extends AbstractWraplet {
      constructor(core: any) {
        super(core);
        throw new Error("Some other error");
      }
    }

    class ParentWraplet extends AbstractWraplet<
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

    const core = new DefaultCore(span, {
      child: {
        Class: ErrorChildWraplet,
        selector: "div",
        required: false,
        multiple: false,
      },
    });

    const parent = new ParentWraplet(core as any);
    await expect(parent.wraplet.initialize()).rejects.toThrow(
      "Some other error",
    );
  });

  it("should throw if a required single child node type is not supported", async () => {
    class UnsupportedChildWraplet extends AbstractWraplet<HTMLElement> {
      protected supportedNodeTypes() {
        return this.supportedNodeTypesGuard([HTMLSpanElement]); // Only supports spans
      }
    }

    class ParentWraplet extends AbstractWraplet<
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

    const core = new DefaultCore(div, {
      child: {
        Class: UnsupportedChildWraplet,
        selector: "div",
        required: true,
        multiple: false,
      },
    });

    const parent = new ParentWraplet(core as any);
    await expect(parent.wraplet.initialize()).rejects.toThrow(
      UnsupportedNodeTypeError,
    );
  });
});
