import "../setup";
import { DNTM } from "../../src/NodeTreeManager/DNTM";
import { AbstractWraplet } from "../../src";
import { buildFlatTree, buildNestedTree, measureMedian } from "./utils";

describe("DNTM performance", () => {
  /**
   * A minimal wraplet whose initialization does no real work.
   * Any time spent in `initialize()` is therefore pure framework overhead.
   */
  class NoopWraplet extends AbstractWraplet<Element> {}

  it("scales reasonably with the number of node initializers", async () => {
    const initializerCount = 50000;

    const median = await measureMedian(async () => {
      const dntm = new DNTM();
      for (let i = 0; i < initializerCount; i++) {
        dntm.addNodeInitializer(async () => {
          // intentionally empty
        });
      }
      const node = document.createElement("div");
      document.body.appendChild(node);
      await dntm.initializeNode(node);
      node.remove();
    });

    console.log(
      `[perf] ${initializerCount} initializers median: ${median.toFixed(2)}ms`,
    );
    expect(median).toBeLessThan(250);
  });

  it("scales reasonably with the number of initializeNode calls", async () => {
    const nodeCount = 10000;
    const initializersPerNode = 5;

    const median = await measureMedian(async () => {
      const dntm = new DNTM();
      for (let i = 0; i < initializersPerNode; i++) {
        dntm.addNodeInitializer(async () => {
          // intentionally empty
        });
      }
      const root = buildFlatTree(nodeCount);
      const nodes = Array.from(root.querySelectorAll("[data-node]"));
      await Promise.all(nodes.map((n) => dntm.initializeNode(n)));
      root.remove();
    });

    console.log(
      `[perf] ${nodeCount} nodes × ${initializersPerNode} initializers median: ${median.toFixed(2)}ms`,
    );
    expect(median).toBeLessThan(500);
  });

  it("initializeNode overhead vs. raw Promise.all baseline", async () => {
    const initializerCount = 5000;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const noopInitializer = async (node: Node) => {
      // intentionally empty
    };

    // --- Baseline: pure Promise.all over the same number of no-op
    // async callbacks, without any DNTM machinery.
    const baselineMedian = await measureMedian(async () => {
      const initializers = Array.from(
        { length: initializerCount },
        () => noopInitializer,
      );
      const node = document.createElement("div");
      await Promise.all(initializers.map((fn) => fn(node)));
    });

    // --- DNTM-driven path
    const dntmMedian = await measureMedian(async () => {
      const dntm = new DNTM();
      for (let i = 0; i < initializerCount; i++) {
        dntm.addNodeInitializer(noopInitializer);
      }
      const node = document.createElement("div");
      await dntm.initializeNode(node);
    });

    const overhead = dntmMedian - baselineMedian;
    const overheadRatio = dntmMedian / Math.max(baselineMedian, 0.001);

    console.log(
      `[perf] baseline: ${baselineMedian.toFixed(2)}ms, DNTM: ${dntmMedian.toFixed(2)}ms, ` +
        `overhead: ${overhead.toFixed(2)}ms (×${overheadRatio.toFixed(2)})`,
    );

    // The factor below is intentionally generous - it's not meant to
    // assert "DNTM is fast", but to alarm if a future change makes the
    // overhead grow by an order of magnitude.
    expect(overheadRatio).toBeLessThan(10);
  });

  it("destroyNode scales reasonably with deep DOM trees", async () => {
    const depth = 1000;

    const median = await measureMedian(async () => {
      const dntm = new DNTM();
      const root = buildNestedTree(depth);
      // No wraplets attached - this measures pure tree traversal cost.
      await dntm.destroyNode(root);
      root.remove();
    });

    console.log(
      `[perf] destroyNode depth=${depth} median: ${median.toFixed(2)}ms`,
    );
    expect(median).toBeLessThan(1000);
  });

  it("destroyNode scales reasonably with wide DOM trees containing wraplets", async () => {
    const nodeCount = 2000;

    const median = await measureMedian(async () => {
      const dntm = new DNTM();
      const root = buildFlatTree(nodeCount);
      // Attach + initialize a wraplet on every node so that destroyNode
      // can actually destroy them (destroy() on a non-initialized wraplet throws).
      const nodes = Array.from(root.querySelectorAll("[data-node]"));
      const wraplets = nodes.map((n) => new NoopWraplet(n as Element));
      await Promise.all(wraplets.map((w) => w.wraplet.initialize()));
      await dntm.destroyNode(root);
      root.remove();
    });

    console.log(
      `[perf] destroyNode flat ${nodeCount} wraplets median: ${median.toFixed(2)}ms`,
    );
    expect(median).toBeLessThan(500);
  });
});
