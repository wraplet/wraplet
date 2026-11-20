import "./setup";

import {
  AbstractDependentWraplet,
  AbstractWraplet,
  DDM,
  WrapletDependencyMap,
} from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

const funcCounter = jest.fn();
beforeEach(() => {
  funcCounter.mockClear();
});

const testWrapletSelectorAttribute = "data-test-selector";
const testWrapletDependencySelectorSingleAttribute =
  "data-test-dependency-selector-single";
const testWrapletDependencySelectorSingleOptionalAttribute =
  "data-test-dependency-selector-single-optional";
const testWrapletDependencySelectorIndestructibleAttribute =
  "data-test-dependency-indestructible";
const testWrapletDependencySelectorMultipleAttribute =
  "data-test-dependency-selector-multiple";
class TestWrapletDependency extends AbstractWraplet {
  protected async onDestroy(): Promise<void> {
    funcCounter();
  }
}

const dependenciesMap = {
  dependency: {
    selector: `[${testWrapletDependencySelectorSingleAttribute}]`,
    Class: TestWrapletDependency,
    multiple: false,
    required: false,
  },
  dependencyIndestuctible: {
    selector: `[${testWrapletDependencySelectorIndestructibleAttribute}]`,
    Class: TestWrapletDependency,
    multiple: false,
    required: false,
    destructible: false,
  },
  dependencyOptional: {
    selector: `[${testWrapletDependencySelectorSingleOptionalAttribute}]`,
    Class: TestWrapletDependency,
    multiple: false,
    required: false,
  },
  dependencies: {
    selector: `[${testWrapletDependencySelectorMultipleAttribute}]`,
    Class: TestWrapletDependency,
    multiple: true,
    required: false,
  },
} as const satisfies WrapletDependencyMap;

class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

it("Test that 'destroy' is invoked on all dependencies", async () => {
  document.body.innerHTML = `
<div ${testWrapletSelectorAttribute}>
    <div ${testWrapletDependencySelectorSingleAttribute} class="c1"></div>
    <div ${testWrapletDependencySelectorIndestructibleAttribute} class="c-indestructible"></div>    
    <div ${testWrapletDependencySelectorMultipleAttribute} class="c2"></div>
    <div ${testWrapletDependencySelectorMultipleAttribute} class="c3"></div>
    <div ${testWrapletDependencySelectorMultipleAttribute} class="c4"></div>
    <div ${testWrapletDependencySelectorMultipleAttribute} class="c5"></div>
</div>
`;
  const wraplet = TestWraplet.create(
    testWrapletSelectorAttribute,
    dependenciesMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not created.");
  }
  await wraplet.wraplet.initialize();
  await wraplet.wraplet.destroy();
  expect(funcCounter).toHaveBeenCalledTimes(5);
});

it("Test that dependencies are removed from the nodes after being destroyed", async () => {
  document.body.innerHTML = `
<div ${testWrapletSelectorAttribute}>
    <div ${testWrapletDependencySelectorSingleAttribute}></div>
    <div ${testWrapletDependencySelectorIndestructibleAttribute}></div>    
    <div ${testWrapletDependencySelectorMultipleAttribute}></div>
    <div ${testWrapletDependencySelectorMultipleAttribute}></div>
    <div ${testWrapletDependencySelectorMultipleAttribute}></div>
    <div ${testWrapletDependencySelectorMultipleAttribute}></div>
</div>
`;
  const wraplet = TestWraplet.create(
    testWrapletSelectorAttribute,
    dependenciesMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not initialized.");
  }
  await wraplet.wraplet.initialize();
  await wraplet.wraplet.destroy();
  const elements = document.querySelectorAll("*");

  for (const element of elements) {
    if (!element.wraplets) {
      if (element.matches("html, head, body")) continue;
      throw new Error("No wraplets found in the element.");
    }
    if (
      element.hasAttribute(testWrapletDependencySelectorIndestructibleAttribute)
    ) {
      expect(element.wraplets.size).toEqual(1);
    } else {
      expect(element.wraplets.size).toEqual(0);
    }
  }
});

it("Test that listeneres are being detached during destruction", async () => {
  const listener = jest.fn();
  class TestWrapletDependency extends AbstractWraplet {
    constructor(node: Node) {
      super(node);

      this.nodeManager.addListener("click", () => {
        listener();
      });
    }
  }
  const mainAttribute = "data-test-main";
  const dependencyAttribute = "data-test-dependency";
  const dependenciesMap = {
    dependency: {
      selector: `[${dependencyAttribute}]`,
      Class: TestWrapletDependency,
      multiple: false,
      required: false,
    },
  } satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${dependencyAttribute}></div>
</div>
`;

  const main = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
    mainAttribute,
    dependenciesMap,
  );

  if (!main) {
    throw new Error("Wraplet not created.");
  }

  await main.wraplet.initialize();

  const dependency = main.getDependency("dependency");
  if (!dependency) {
    throw new Error("Dependency not found.");
  }

  const dependencyNode = document.querySelector(
    `[${dependencyAttribute}]`,
  ) as Element;
  dependencyNode.dispatchEvent(new Event("click"));
  await main.wraplet.destroy();
  dependencyNode.dispatchEvent(new Event("click"));

  expect(listener).toHaveBeenCalledTimes(1);
});

it("Test that if the required dependency has been destroyed then throw exception", async () => {
  const mainAttribute = "data-test-main";
  const dependencyAttribute = "data-test-dependency";

  class TestWrapletDependency extends AbstractWraplet {}

  const dependenciesMap = {
    dependency: {
      selector: `[${dependencyAttribute}]`,
      Class: TestWrapletDependency,
      multiple: false,
      required: true,
    },
  } satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${dependencyAttribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
    mainAttribute,
    dependenciesMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not created.");
  }

  await wraplet.wraplet.initialize();

  const dependency = wraplet.getDependency("dependency");
  if (!dependency) {
    throw new Error("Dependency not found.");
  }

  await expect(dependency.wraplet.destroy).rejects.toThrow(AggregateError);
});

it("Test isDestroyed values", async () => {
  const mainAttribute = "data-test-main";
  const dependencyAttribute = "data-test-dependency";

  class TestWrapletDependency extends AbstractWraplet {}

  const dependenciesMap = {
    dependency: {
      selector: `[${dependencyAttribute}]`,
      Class: TestWrapletDependency,
      multiple: false,
      required: false,
    },
  } satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {}

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div ${dependencyAttribute}></div>
</div>
`;

  const wraplet = TestWraplet.create<typeof dependenciesMap, TestWraplet>(
    mainAttribute,
    dependenciesMap,
  );
  if (!wraplet) {
    throw new Error("Wraplet not created.");
  }
  await wraplet.wraplet.initialize();
  expect(wraplet.wraplet.status.isGettingDestroyed).toBe(false);
  expect(wraplet.wraplet.status.isDestroyed).toBe(false);
  await wraplet.wraplet.destroy();
  expect(wraplet.wraplet.status.isDestroyed).toBe(true);
});

it("Test that errors are grouped differently depending on whether they come from 'destroy' or 'afterDestroy' listeners", async () => {
  class TestWraplet extends AbstractDependentWraplet {}

  const element = document.createElement("div");
  const ddm = new DDM(element, {});
  const wraplet = new TestWraplet(ddm);

  await wraplet.wraplet.initialize();

  const destroyError = new Error("destroy listener error");
  const afterDestroyError = new Error("after-destroy listener error");

  wraplet.wraplet.onDestroy(async () => {
    throw destroyError;
  });

  wraplet.wraplet.onAfterDestroy(async () => {
    throw afterDestroyError;
  });

  let thrown: unknown = null;
  try {
    await wraplet.wraplet.destroy();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(AggregateError);
  const aggregate = thrown as AggregateError;
  expect(aggregate.errors).toHaveLength(2);

  const destroyGroup = aggregate.errors.find(
    (error: Error) => error.message === "Errors in destroy listeners.",
  ) as AggregateError | undefined;
  const afterDestroyGroup = aggregate.errors.find(
    (error: Error) => error.message === "Errors in after-destroy listeners.",
  ) as AggregateError | undefined;

  expect(destroyGroup).toBeInstanceOf(AggregateError);
  expect(afterDestroyGroup).toBeInstanceOf(AggregateError);

  expect(destroyGroup?.errors).toContain(destroyError);
  expect(destroyGroup?.errors).not.toContain(afterDestroyError);

  expect(afterDestroyGroup?.errors).toContain(afterDestroyError);
  expect(afterDestroyGroup?.errors).not.toContain(destroyError);
});

it("Test order of invoked destroy listeners is reversed", async () => {
  class TestWraplet extends AbstractDependentWraplet {}

  const element = document.createElement("div");
  const ddm = new DDM(element, {});
  const wraplet = new TestWraplet(ddm);

  await wraplet.wraplet.initialize();

  let result: string = "";

  wraplet.wraplet.onDestroy(async () => {
    result += "1";
  });

  wraplet.wraplet.onDestroy(async () => {
    result += "2";
  });

  await wraplet.wraplet.destroy();

  expect(result).toEqual("21");
});
