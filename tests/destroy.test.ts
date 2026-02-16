import "./setup";

import {
  AbstractWraplet,
  customizeDefaultWrapletApi,
  DefaultCore,
  destructionCompleted,
  destructionStarted,
  Status,
  WrapletDependencyMap,
} from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { RequiredDependencyDestroyedError } from "../src/errors";
import { DependencyInstance } from "../src/Wraplet/types/DependencyInstance";
import { Core } from "../src";

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
  status: Status = {
    isGettingInitialized: false,
    isInitialized: false,
    isDestroyed: false,
    isGettingDestroyed: false,
  };

  constructor(core: Core<Element>) {
    super(core);

    this.wraplet = customizeDefaultWrapletApi(
      {
        status: this.status,
        destroy: async () => {
          await destructionStarted(
            this.status,
            this.core,
            this,
            this.destroyListeners,
          );

          funcCounter();

          await destructionCompleted(this.status, this.core, this);
        },
      },
      this.wraplet,
    );
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
    constructor(core: Core) {
      super(core);

      this.core.addEventListener(this.node, "click", () => {
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
  } as const satisfies WrapletDependencyMap;

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
  } as const satisfies WrapletDependencyMap;

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

  await expect(async () => {
    await dependency.wraplet.destroy();
  }).rejects.toThrow(RequiredDependencyDestroyedError);
});

it("Destroy dependency listener", async () => {
  const mainAttribute = "data-test-main";
  const dependencyAttribute = "data-test-dependency";

  const func = jest.fn();

  class TestWrapletDependency extends AbstractWraplet {}

  const dependenciesMap = {
    dependency: {
      selector: `[${dependencyAttribute}]`,
      Class: TestWrapletDependency,
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {
    protected onDependencyDestroyed<K extends keyof typeof dependenciesMap>(
      dependency: DependencyInstance<typeof dependenciesMap, K>,
      id: K,
    ) {
      expect(id).toEqual("dependency");
      expect(dependency).toBeInstanceOf(TestWrapletDependency);
      func();
    }
  }

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
  await dependency.wraplet.destroy();

  expect(func).toHaveBeenCalledTimes(1);
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
  } as const satisfies WrapletDependencyMap;

  class TestWraplet extends BaseElementTestWraplet<typeof dependenciesMap> {
    protected onDependencyDestroyed() {
      expect(this.wraplet.status.isGettingDestroyed).toBe(true);
      expect(this.wraplet.status.isDestroyed).toBe(false);
    }
  }

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

it("Test order of invoked destroy listeners is reversed", async () => {
  class TestWraplet extends AbstractWraplet {}

  const element = document.createElement("div");
  const core = new DefaultCore(element, {});
  const wraplet = new TestWraplet(core);

  await wraplet.wraplet.initialize();

  let result: string = "";

  wraplet.wraplet.addDestroyListener(async () => {
    result += "1";
  });

  wraplet.wraplet.addDestroyListener(async () => {
    result += "2";
  });

  await wraplet.wraplet.destroy();

  expect(result).toEqual("21");
});
