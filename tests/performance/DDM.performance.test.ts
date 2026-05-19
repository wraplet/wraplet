import "../setup";
import { DDM } from "../../src/DependencyManager/DDM";
import { AbstractWraplet, WrapletDependencyMap } from "../../src";
import { buildFlatTree, measureMedian } from "./utils";

describe("DDM.initializeDeps performance", () => {
  /**
   * A minimal wraplet whose initialization does no real work.
   * Any time spent in `initialize()` is therefore pure framework overhead
   * (Promise.all wrapping, async/await microtasks, listener dispatch).
   */
  class NoopWraplet extends AbstractWraplet<Element> {}

  it("scales reasonably with the number of multiple dependencies", async () => {
    const dependencyCount = 500;

    const map = {
      items: {
        selector: "[data-dep]",
        multiple: true,
        Class: NoopWraplet,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    const median = await measureMedian(async () => {
      const root = buildFlatTree(dependencyCount);
      const ddm = new DDM(root, map);
      ddm.instantiateDependencies();
      await ddm.initializeDependencies();
      root.remove();
    });

    console.log(
      `[perf] ${dependencyCount} deps median: ${median.toFixed(2)}ms`,
    );
    expect(median).toBeLessThan(250);
  });

  it("listener microtask overhead is bounded", async () => {
    const dependencyCount = 200;
    const listenersPerDependency = 10;

    const map = {
      items: {
        selector: "[data-dep]",
        multiple: true,
        Class: NoopWraplet,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    const root = buildFlatTree(dependencyCount);
    const ddm = new DDM(root, map);

    // Each listener is a no-op but still wrapped by initializeDeps.
    // This measures whether the per-listener overhead
    // is roughly linear (it should be).
    for (let i = 0; i < listenersPerDependency; i++) {
      ddm.addDependencyInitializedListener("items", async () => {
        // intentionally empty
      });
    }

    ddm.instantiateDependencies();

    const start = performance.now();
    await ddm.initializeDependencies();
    const elapsed = performance.now() - start;

    console.log(
      `[perf] ${dependencyCount} deps × ${listenersPerDependency} listeners: ${elapsed.toFixed(2)}ms`,
    );
    expect(elapsed).toBeLessThan(500);
  });

  it("compares DDM init cost vs. raw Promise.all baseline", async () => {
    const dependencyCount = 50000;

    const map = {
      items: {
        selector: "[data-dep]",
        multiple: true,
        Class: NoopWraplet,
        required: false,
      },
    } satisfies WrapletDependencyMap;

    // --- Baseline: just create the wraplets and call initialize() in parallel,
    // skipping all DDM machinery. This represents the theoretical minimum.
    const baselineMedian = await measureMedian(async () => {
      const root = buildFlatTree(dependencyCount);
      const nodes = Array.from(root.querySelectorAll("[data-dep]"));
      const wraplets = nodes.map((n) => new NoopWraplet(n as Element));
      await Promise.all(wraplets.map((w) => w.wraplet.initialize()));
      root.remove();
    });

    // --- DDM-driven path
    const ddmMedian = await measureMedian(async () => {
      const root = buildFlatTree(dependencyCount);
      const ddm = new DDM(root, map);
      ddm.instantiateDependencies();
      await ddm.initializeDependencies();
      root.remove();
    });

    const overhead = ddmMedian - baselineMedian;
    const overheadRatio = ddmMedian / Math.max(baselineMedian, 0.001);

    console.log(
      `[perf] baseline: ${baselineMedian.toFixed(2)}ms, DDM: ${ddmMedian.toFixed(2)}ms, ` +
        `overhead: ${overhead.toFixed(2)}ms (×${overheadRatio.toFixed(2)})`,
    );

    // The DDM is expected to be slower than the baseline because of
    // listener dispatch, status tracking and the dependency map traversal.
    //
    // The factor below is intentionally generous - it's not meant to
    // assert "DDM is fast", but to alarm if a future change makes the
    // overhead grow by an order of magnitude (e.g. an accidental O(N²)
    // listener loop, or an unnecessary `await` per node).
    expect(overheadRatio).toBeLessThan(10);
  });
});
