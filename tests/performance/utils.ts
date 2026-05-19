/**
 * Builds a DOM tree with N siblings matching the given attribute,
 * all directly under a root element.
 */
export function buildFlatTree(count: number): HTMLElement {
  const root = document.createElement("div");
  for (let i = 0; i < count; i++) {
    const child = document.createElement("div");
    child.setAttribute("data-dep", "");
    root.appendChild(child);
  }
  document.body.appendChild(root);
  return root;
}

/**
 * Builds a nested DOM tree of the given depth, with one child per level.
 */
export function buildNestedTree(depth: number): HTMLElement {
  const root = document.createElement("div");
  let current: HTMLElement = root;
  for (let i = 0; i < depth; i++) {
    const child = document.createElement("div");
    current.appendChild(child);
    current = child;
  }
  document.body.appendChild(root);
  return root;
}

/**
 * Measures wall-clock time of an async operation, taking the median
 * of several runs to smooth out noise from GC and timer resolution.
 */
export async function measureMedian(
  fn: () => Promise<void>,
  runs: number = 5,
): Promise<number> {
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    // Force GC before each run to avoid stop-the-world pauses
    // contaminating the measurement. Only available with --expose-gc.
    if (typeof global.gc === "function") {
      global.gc();
    }
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}
